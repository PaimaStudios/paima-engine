import type {
  CdeMinaActionGenericDatum,
  CdeMinaEventGenericDatum,
  ChainDataExtensionMinaActionGeneric,
  ChainDataExtensionMinaEventGeneric,
} from '@paima/sm';
import { ChainDataExtensionDatumType } from '@paima/utils';
import postgres from 'postgres';

export async function getEventCdeData(
  pg: postgres.Sql,
  extension: ChainDataExtensionMinaEventGeneric,
  fromTimestamp: number,
  toTimestamp: number,
  getBlockNumber: (minaTimestamp: number) => number,
  network: string,
  cursor?: string
): Promise<CdeMinaEventGenericDatum[]> {
  const grouped = [] as {
    blockInfo: {
      height: number;
      timestamp: string;
    };
    // TODO: could each data by just a tuple?
    eventData: { data: string[][]; txHash: string }[];
  }[];

  const events = await getEventsQuery(
    pg,
    extension.address,
    toTimestamp.toString(),
    fromTimestamp.toString(),
    cursor
  );

  for (const block of events) {
    const eventData = [] as { data: string[][]; txHash: string }[];

    for (const blockEvent of block.events) {
      if (
        eventData[eventData.length - 1] &&
        blockEvent.hash == eventData[eventData.length - 1].txHash
      ) {
        eventData[eventData.length - 1].data.push(blockEvent.data);
      } else {
        eventData.push({ txHash: blockEvent.hash, data: [blockEvent.data] });
      }
    }

    grouped.push({ blockInfo: { height: block.height, timestamp: block.timestamp }, eventData });
  }

  return grouped.flatMap(perBlock =>
    perBlock.eventData.map(txEvent => ({
      cdeId: extension.cdeId,
      cdeDatumType: ChainDataExtensionDatumType.MinaEventGeneric,
      blockNumber: getBlockNumber(Number.parseInt(perBlock.blockInfo.timestamp, 10)),
      payload: txEvent,
      network,
      scheduledPrefix: extension.scheduledPrefix,
      paginationCursor: { cursor: txEvent.txHash, finished: false },
    }))
  );
}

export async function getActionCdeData(
  pg: postgres.Sql,
  extension: ChainDataExtensionMinaActionGeneric,
  fromTimestamp: number,
  toTimestamp: number,
  getBlockNumber: (minaTimestamp: number) => number,
  network: string,
  cursor?: string
): Promise<CdeMinaActionGenericDatum[]> {
  const grouped = [] as {
    blockInfo: {
      height: number;
      timestamp: string;
    };
    // TODO: could each data by just a tuple?
    actionData: { data: string[][]; txHash: string }[];
  }[];

  const actions = await getActionsQuery(
    pg,
    extension.address,
    toTimestamp.toString(),
    fromTimestamp.toString(),
    cursor
  );

  for (const block of actions) {
    const actionData = [] as { data: string[][]; txHash: string }[];

    for (const blockEvent of block.actions) {
      if (
        actionData[actionData.length - 1] &&
        blockEvent.hash == actionData[actionData.length - 1].txHash
      ) {
        actionData[actionData.length - 1].data.push(blockEvent.data);
      } else {
        actionData.push({ txHash: blockEvent.hash, data: [blockEvent.data] });
      }
    }

    grouped.push({ blockInfo: { height: block.height, timestamp: block.timestamp }, actionData });
  }

  return grouped.flatMap(perBlock =>
    perBlock.actionData.map(txEvent => ({
      cdeId: extension.cdeId,
      cdeDatumType: ChainDataExtensionDatumType.MinaActionGeneric,
      blockNumber: getBlockNumber(Number.parseInt(perBlock.blockInfo.timestamp, 10)),
      payload: txEvent,
      network,
      scheduledPrefix: extension.scheduledPrefix,
      paginationCursor: { cursor: txEvent.txHash, finished: false },
    }))
  );
}

function fullChainCTE(db_client: postgres.Sql, toTimestamp?: string, fromTimestamp?: string) {
  return db_client`
  full_chain AS (
    SELECT
      id, state_hash, height, global_slot_since_genesis, timestamp
    FROM
      blocks b
    WHERE
      chain_status = 'canonical'
    ${fromTimestamp ? db_client`AND b.timestamp::decimal >= ${fromTimestamp}::decimal` : db_client``}
    ${toTimestamp ? db_client`AND b.timestamp::decimal <= ${toTimestamp}::decimal` : db_client``}
    ORDER BY height
  )
  `;
}

function accountIdentifierCTE(db_client: postgres.Sql, address: string) {
  return db_client`
  account_identifier AS (
    SELECT
      id AS requesting_zkapp_account_identifier_id
    FROM
      account_identifiers ai
    WHERE
      ai.public_key_id = (SELECT id FROM public_keys WHERE value = ${address})
  )`;
}

function blocksAccessedCTE(db_client: postgres.Sql) {
  return db_client`
  blocks_accessed AS
  (
    SELECT
      requesting_zkapp_account_identifier_id,
      block_id,
      account_identifier_id,
      zkapp_id,
      id AS account_access_id,
      state_hash,
      height,
      global_slot_since_genesis,
      timestamp
  FROM
    account_identifier ai
    INNER JOIN accounts_accessed aa ON ai.requesting_zkapp_account_identifier_id = aa.account_identifier_id
    INNER JOIN full_chain b ON aa.block_id = b.id
  )`;
}

function emittedZkAppCommandsCTE(db_client: postgres.Sql, after?: string) {
  return db_client`
  emitted_zkapp_commands AS (
    SELECT
      blocks_accessed.*,
      zkcu.id AS zkapp_account_update_id,
      zkapp_fee_payer_body_id,
      zkapp_account_updates_ids,
      authorization_kind,
      status,
      memo,
      hash,
      body_id,
      events_id,
      actions_id
    FROM
      blocks_accessed
      INNER JOIN blocks_zkapp_commands bzkc ON blocks_accessed.block_id = bzkc.block_id
      INNER JOIN zkapp_commands zkc ON bzkc.zkapp_command_id = zkc.id
      INNER JOIN zkapp_account_update zkcu ON zkcu.id = ANY(zkc.zkapp_account_updates_ids)
      INNER JOIN zkapp_account_update_body zkcu_body ON zkcu_body.id = zkcu.body_id
      AND zkcu_body.account_identifier_id = requesting_zkapp_account_identifier_id
      ${after ? db_client`AND zkc.id > (SELECT id FROM zkapp_commands WHERE zkapp_commands.hash = ${after})` : db_client``}
    WHERE
      bzkc.status <> 'failed'
  )`;
}

function emittedEventsCTE(db_client: postgres.Sql) {
  return db_client`
  emitted_events AS (
    SELECT
      *,
      zke.id AS zkapp_event_id,
      zke.element_ids AS zkapp_event_element_ids,
      zkfa.id AS zkapp_event_array_id
    FROM
      emitted_zkapp_commands
      INNER JOIN zkapp_events zke ON zke.id = events_id
      INNER JOIN zkapp_field_array zkfa ON zkfa.id = ANY(zke.element_ids)
      INNER JOIN zkapp_field zkf ON zkf.id = ANY(zkfa.element_ids)
  )
  `;
}

function emittedActionsCTE(db_client: postgres.Sql) {
  return db_client`
  emitted_actions AS (
    SELECT
      *,
      zke.id AS zkapp_event_id,
      zke.element_ids AS zkapp_event_element_ids,
      zkfa.id AS zkapp_event_array_id
    FROM
      emitted_zkapp_commands
      INNER JOIN zkapp_events zke ON zke.id = actions_id
      INNER JOIN zkapp_field_array zkfa ON zkfa.id = ANY(zke.element_ids)
      INNER JOIN zkapp_field zkf ON zkf.id = ANY(zkfa.element_ids)
  )
  `;
}

function emittedActionStateCTE(
  db_client: postgres.Sql,
  fromActionState?: string,
  endActionState?: string
) {
  return db_client`
  emitted_action_state AS (
    SELECT
      zkf0.field AS action_state_value1,
      zkf1.field AS action_state_value2,
      zkf2.field AS action_state_value3,
      zkf3.field AS action_state_value4,
      zkf4.field AS action_state_value5,
      emitted_actions.*
    FROM
      emitted_actions
      INNER JOIN zkapp_accounts zkacc ON zkacc.id = emitted_actions.zkapp_id
      INNER JOIN zkapp_action_states zks ON zks.id = zkacc.action_state_id
      INNER JOIN zkapp_field zkf0 ON zkf0.id = zks.element0
      INNER JOIN zkapp_field zkf1 ON zkf1.id = zks.element1
      INNER JOIN zkapp_field zkf2 ON zkf2.id = zks.element2
      INNER JOIN zkapp_field zkf3 ON zkf3.id = zks.element3
      INNER JOIN zkapp_field zkf4 ON zkf4.id = zks.element4
    WHERE
      1 = 1
    ${
      fromActionState
        ? db_client`AND zkf0.id >= (SELECT id FROM zkapp_field WHERE field = ${fromActionState})`
        : db_client``
    }
    ${
      endActionState
        ? db_client`AND zkf0.id <= (SELECT id FROM zkapp_field WHERE field = ${endActionState})`
        : db_client``
    }
  )`;
}

interface EventsPerBlock {
  timestamp: string;
  height: number;
  events: {
    hash: string;
    data: string[];
  }[];
}

export function getEventsQuery(
  db_client: postgres.Sql,
  address: string,
  toTimestamp?: string,
  fromTimestamp?: string,
  after?: string,
  limit?: string
) {
  return db_client<EventsPerBlock[]>`
  WITH 
  ${fullChainCTE(db_client, toTimestamp, fromTimestamp)},
  ${accountIdentifierCTE(db_client, address)},
  ${blocksAccessedCTE(db_client)},
  ${emittedZkAppCommandsCTE(db_client, after)},
  ${emittedEventsCTE(db_client)},
  grouped_events AS (
    SELECT
      MAX(timestamp) timestamp,
      MAX(hash) hash,
      JSON_AGG(field) events_data,
      MAX(height) height
    FROM emitted_events
    GROUP BY (
      zkapp_account_update_id,
      zkapp_event_array_id
    )
    ORDER BY height
  )
  SELECT
    MAX(timestamp) timestamp,
    height,
    JSON_AGG(JSON_BUILD_OBJECT('hash', hash, 'data', events_data)) events
  FROM grouped_events
  GROUP BY height
  ORDER BY height
  `;
}

interface ActionsPerBlock {
  timestamp: string;
  height: number;
  actions: {
    hash: string;
    data: string[];
  }[];
}

export function getActionsQuery(
  db_client: postgres.Sql,
  address: string,
  toTimestamp?: string,
  fromTimestamp?: string,
  after?: string,
  limit?: string
) {
  return db_client<ActionsPerBlock[]>`
  WITH
  ${fullChainCTE(db_client, toTimestamp, fromTimestamp)},
  ${accountIdentifierCTE(db_client, address)},
  ${blocksAccessedCTE(db_client)},
  ${emittedZkAppCommandsCTE(db_client, after)},
  ${emittedActionsCTE(db_client)},
  ${emittedActionStateCTE(db_client)},
  grouped_events AS (
    SELECT
      MAX(timestamp) timestamp,
      MAX(hash) hash,
      JSON_AGG(field) actions_data,
      MAX(height) height
    FROM emitted_actions
    GROUP BY (
  	  zkapp_account_update_id,
      zkapp_event_array_id
  	)
  	ORDER BY height
  )
  SELECT
    MAX(timestamp) timestamp,
    height,
    JSON_AGG(JSON_BUILD_OBJECT('hash', hash, 'data', actions_data)) actions
  FROM grouped_events
  GROUP BY height
  ORDER BY height
  `;
}
