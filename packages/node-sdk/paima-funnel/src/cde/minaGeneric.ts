import type {
  CdeMinaActionGenericDatum,
  CdeMinaEventGenericDatum,
  ChainDataExtensionMinaActionGeneric,
  ChainDataExtensionMinaEventGeneric,
} from '@paima/sm';
import { ChainDataExtensionDatumType } from '@paima/utils';
import type pg from 'pg';

export async function getEventCdeData(args: {
  pg: pg.Client;
  extension: ChainDataExtensionMinaEventGeneric;
  fromTimestamp: number;
  toTimestamp: number;
  getBlockNumber: (minaTimestamp: number) => number;
  caip2: string;
  isPresync: boolean;
  cursor?: string;
  limit?: number;
  fromBlockHeight?: number;
}): Promise<(CdeMinaActionGenericDatum | CdeMinaEventGenericDatum)[]> {
  return await getCdeData(
    getEventsQuery,
    ChainDataExtensionDatumType.MinaEventGeneric,
    args.pg,
    args.extension,
    args.fromTimestamp,
    args.toTimestamp,
    args.getBlockNumber,
    args.caip2,
    args.isPresync,
    args.cursor,
    args.limit,
    args.fromBlockHeight
  );
}

export async function getActionCdeData(args: {
  pg: pg.Client;
  extension: ChainDataExtensionMinaActionGeneric;
  fromTimestamp: number;
  toTimestamp: number;
  getBlockNumber: (minaTimestamp: number) => number;
  caip2: string;
  isPresync: boolean;
  cursor?: string;
  limit?: number;
  fromBlockHeight?: number;
}): Promise<(CdeMinaActionGenericDatum | CdeMinaEventGenericDatum)[]> {
  return await getCdeData(
    getActionsQuery,
    ChainDataExtensionDatumType.MinaActionGeneric,
    args.pg,
    args.extension,
    args.fromTimestamp,
    args.toTimestamp,
    args.getBlockNumber,
    args.caip2,
    args.isPresync,
    args.cursor,
    args.limit,
    args.fromBlockHeight
  );
}

export async function getCdeData(
  query: typeof getEventsQuery | typeof getActionsQuery,
  cdeDatumType:
    | ChainDataExtensionDatumType.MinaActionGeneric
    | ChainDataExtensionDatumType.MinaEventGeneric,
  pg: pg.Client,
  extension: ChainDataExtensionMinaEventGeneric | ChainDataExtensionMinaActionGeneric,
  fromTimestamp: number,
  toTimestamp: number,
  getBlockNumber: (minaTimestamp: number) => number,
  caip2: string,
  isPresync: boolean,
  cursor?: string,
  limit?: number,
  fromBlockHeight?: number
): Promise<(CdeMinaActionGenericDatum | CdeMinaEventGenericDatum)[]> {
  const result = [] as (CdeMinaActionGenericDatum | CdeMinaEventGenericDatum)[];

  while (true) {
    const unmapped = await query(
      pg,
      extension.address,
      toTimestamp.toString(),
      fromTimestamp.toString(),
      cursor,
      limit?.toString(),
      fromBlockHeight?.toString()
    );

    const grouped = groupByTx(unmapped.rows);

    const events = grouped.flatMap(perBlock =>
      perBlock.eventsData.map(txEvent => ({
        cdeName: extension.cdeName,
        cdeDatumType,
        blockNumber: getBlockNumber(Number.parseInt(perBlock.blockInfo.timestamp, 10)),
        transactionHash: txEvent.txHash,
        payload: txEvent,
        caip2,
        scheduledPrefix: extension.scheduledPrefix,
        paginationCursor: { cursor: txEvent.txHash, finished: false },
      }))
    );

    if (events.length > 0) {
      const last = events[events.length - 1];

      cursor = last.paginationCursor.cursor;
    }

    result.push(...events);

    if (events.length === 0 || isPresync) {
      break;
    }
  }

  return result;
}

type EventsGroupedByTx = {
  blockInfo: {
    height: number;
    timestamp: string;
  };
  eventsData: { data: string[][]; txHash: string }[];
}[];

function groupByTx(events: PerBlock[]): EventsGroupedByTx {
  const grouped = [] as EventsGroupedByTx;

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

    grouped.push({
      blockInfo: { height: block.height, timestamp: block.timestamp },
      eventsData: eventData,
    });
  }

  return grouped;
}

function canonicalChainCTE(
  toTimestamp?: string,
  fromTimestamp?: string,
  fromBlockHeight?: string
): string {
  return `
  canonical_chain AS (
    SELECT
      id, state_hash, height, global_slot_since_genesis, timestamp
    FROM
      blocks b
    WHERE
      1=1
    ${fromTimestamp ? `AND b.timestamp::decimal >= ${fromTimestamp}::decimal` : ``}
    ${toTimestamp ? `AND b.timestamp::decimal <= ${toTimestamp}::decimal` : ``}
    ${fromBlockHeight ? `AND b.height::decimal >= ${fromBlockHeight}::decimal` : ``}
    ORDER BY height
  )
  `;
}

function accountIdentifierCTE(address: string): string {
  return `
  account_identifier AS (
    SELECT
      id AS requesting_zkapp_account_identifier_id
    FROM
      account_identifiers ai
    WHERE
      ai.public_key_id = (SELECT id FROM public_keys WHERE value = '${address}')
  )`;
}

function blocksAccessedCTE(): string {
  return `
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
    INNER JOIN canonical_chain b ON aa.block_id = b.id
  )`;
}

function emittedZkAppCommandsCTE(after?: string): string {
  return `
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
      ${after ? `AND zkc.id > (SELECT id FROM zkapp_commands WHERE zkapp_commands.hash = '${after}')` : ``}
    WHERE
      bzkc.status <> 'failed'
  )`;
}

function emittedEventsCTE(): string {
  return `
  emitted_events AS (
    SELECT
      *,
      zke.id AS zkapp_event_id,
      zke.element_ids AS zkapp_event_element_ids,
      zkfa.id AS zkapp_event_array_id,
      zkf.id as zkf_id
    FROM
      emitted_zkapp_commands
      INNER JOIN zkapp_events zke ON zke.id = events_id
      INNER JOIN zkapp_field_array zkfa ON zkfa.id = ANY(zke.element_ids)
      INNER JOIN zkapp_field zkf ON zkf.id = ANY(zkfa.element_ids)
  )
  `;
}

function emittedActionsCTE(): string {
  return `
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

function emittedActionStateCTE(): string {
  return `
  emitted_action_state AS (
    SELECT
      emitted_actions.*
    FROM
      emitted_actions
      INNER JOIN zkapp_accounts zkacc ON zkacc.id = emitted_actions.zkapp_id
      INNER JOIN zkapp_action_states zks ON zks.id = zkacc.action_state_id
  )`;
}

type PerBlock = {
  timestamp: string;
  height: number;

  events: {
    hash: string;
    data: string[];
  }[];
};

export function getEventsQuery(
  db_client: pg.Client,
  address: string,
  toTimestamp?: string,
  fromTimestamp?: string,
  after?: string,
  limit?: string,
  fromBlockHeight?: string
): Promise<{ rows: PerBlock[] }> {
  let query = `
  WITH 
  ${canonicalChainCTE(toTimestamp, fromTimestamp, fromBlockHeight)},
  ${accountIdentifierCTE(address)},
  ${blocksAccessedCTE()},
  ${emittedZkAppCommandsCTE(after)},
  ${emittedEventsCTE()},
  grouped_events AS (
    SELECT
      MAX(timestamp) timestamp,
      MAX(hash) hash,
      JSON_AGG(field ORDER BY zkf_id) events_data,
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
  ${limit ? `LIMIT ${limit}` : ``}
  `;

  return db_client.query(query);
}

export function getActionsQuery(
  db_client: pg.Client,
  address: string,
  toTimestamp?: string,
  fromTimestamp?: string,
  after?: string,
  limit?: string,
  fromBlockHeight?: string
): Promise<{ rows: PerBlock[] }> {
  const query = `
  WITH
  ${canonicalChainCTE(toTimestamp, fromTimestamp, fromBlockHeight)},
  ${accountIdentifierCTE(address)},
  ${blocksAccessedCTE()},
  ${emittedZkAppCommandsCTE(after)},
  ${emittedActionsCTE()},
  ${emittedActionStateCTE()},
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
    JSON_AGG(JSON_BUILD_OBJECT('hash', hash, 'data', actions_data)) events
  FROM grouped_events
  GROUP BY height
  ORDER BY height
  ${limit ? `LIMIT ${limit}` : ``}
  `;

  return db_client.query(query);
}
