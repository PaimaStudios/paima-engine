import type {
  CdeMinaActionGenericDatum,
  CdeMinaEventGenericDatum,
  ChainDataExtensionMinaActionGeneric,
  ChainDataExtensionMinaEventGeneric,
} from '@paima/sm';
import { ChainDataExtensionDatumType } from '@paima/utils';

export async function getEventCdeData(
  minaArchive: string,
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

  const after = cursor ? `after: "${cursor}"` : '';

  const data = await fetch(minaArchive, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      query: `
        {
          events(
            input: {
              address: "${extension.address}", 
              fromTimestamp: "${fromTimestamp}", 
              toTimestamp: "${toTimestamp}",
              ${after}
            }
          ) {
            blockInfo {
              height
              timestamp
            }
            eventData {
              data
              transactionInfo {
                hash
              }
            }
          }
        }
      `,
    }),
  })
    .then(res => res.json())
    .then(json => json.data.events);

  const events = data as {
    blockInfo: { height: number; timestamp: string };
    eventData: { data: string[]; transactionInfo: { hash: string } }[];
  }[];

  for (const block of events) {
    const eventData = [] as { data: string[][]; txHash: string }[];

    for (const blockEvent of block.eventData) {
      if (
        eventData[eventData.length - 1] &&
        blockEvent.transactionInfo.hash == eventData[eventData.length - 1].txHash
      ) {
        eventData[eventData.length - 1].data.push(blockEvent.data);
      } else {
        eventData.push({ txHash: blockEvent.transactionInfo.hash, data: [blockEvent.data] });
      }
    }

    grouped.push({ blockInfo: block.blockInfo, eventData });
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
  minaArchive: string,
  extension: ChainDataExtensionMinaActionGeneric,
  fromTimestamp: number,
  toTimestamp: number,
  getBlockNumber: (minaTimestamp: number) => number,
  network: string,
  cursor?: string
): Promise<CdeMinaActionGenericDatum[]> {
  const after = cursor ? `after: "${cursor}"` : '';

  const data = await fetch(minaArchive, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      query: `
        {
          actions(
            input: {
              address: "${extension.address}",
              fromTimestamp: "${fromTimestamp}",
              toTimestamp: "${toTimestamp}"
              ${after}
            }
          ) {
            blockInfo {
              height
              timestamp
            }
            actionData {
              data
              transactionInfo {
                hash
              }
            }
          }
        }
      `,
    }),
  })
    .then(res => res.json())
    .then(json => json.data.actions);

  const actions = data as {
    blockInfo: { height: number; timestamp: string };
    actionData: { data: string[]; transactionInfo: { hash: string } }[];
  }[];

  const grouped = [] as {
    blockInfo: {
      height: number;
      timestamp: string;
    };
    // TODO: could each data by just a tuple?
    actionData: { data: string[][]; txHash: string }[];
  }[];

  for (const block of actions) {
    const actionData = [] as { data: string[][]; txHash: string }[];

    for (const blockEvent of block.actionData) {
      if (
        actionData[actionData.length - 1] &&
        blockEvent.transactionInfo.hash == actionData[actionData.length - 1].txHash
      ) {
        actionData[actionData.length - 1].data.push(blockEvent.data);
      } else {
        actionData.push({ txHash: blockEvent.transactionInfo.hash, data: [blockEvent.data] });
      }
    }

    grouped.push({ blockInfo: block.blockInfo, actionData });
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
