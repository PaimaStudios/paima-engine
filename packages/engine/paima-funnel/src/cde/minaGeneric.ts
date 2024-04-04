import { CdeMinaGenericDatum, ChainDataExtensionMinaGeneric } from '@paima/sm';
import { ChainDataExtensionDatumType } from '@paima/utils';

export default async function getCdeData(
  minaArchive: string,
  extension: ChainDataExtensionMinaGeneric,
  fromTimestamp: number,
  toTimestamp: number,
  getBlockNumber: (minaTimestamp: number) => number,
  network: string
): Promise<CdeMinaGenericDatum[]> {
  console.log('from-to', fromTimestamp, toTimestamp);
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
              toTimestamp: "${toTimestamp}" 
            }
          ) {
            blockInfo {
              height
              timestamp
            }
            eventData {
              data
            }
          }
          actions(
            input: {
              address: "${extension.address}",
              fromTimestamp: "${fromTimestamp}",
              toTimestamp: "${toTimestamp}"
            }
          ) {
            blockInfo {
              height
              timestamp
            }
            actionData {
              data
            }
          }
        }
      `,
    }),
  })
    .then(res => res.json())
    .then(json => [json['data']['events'], json['data']['actions']]);

  const events = data[0] as {
    blockInfo: { height: number; timestamp: string };
    eventData: { data: string[] }[];
  }[];

  const actions = data[1] as {
    blockInfo: { height: number; timestamp: string };
    actionData: { data: string[] }[];
  }[];

  const eventsAndActions = [
    ...events.map(ev => ({
      blockInfo: ev.blockInfo,
      data: ev.eventData.map(datum => Object.assign(datum, { kind: 'event' })),
    })),
    ...actions.map(act => ({
      blockInfo: act.blockInfo,
      data: act.actionData.map(datum => Object.assign(datum, { kind: 'action' })),
    })),
  ];

  eventsAndActions.sort((a, b) => a.blockInfo.height - b.blockInfo.height);

  return eventsAndActions.flatMap(perBlock =>
    perBlock.data.map(txEvent => ({
      cdeId: extension.cdeId,
      cdeDatumType: ChainDataExtensionDatumType.MinaGeneric,
      blockNumber: getBlockNumber(Number.parseInt(perBlock.blockInfo.timestamp, 10)),
      payload: txEvent,
      network,
      scheduledPrefix: extension.scheduledPrefix,
      paginationCursor: { cursor: perBlock.blockInfo.timestamp, finished: false },
    }))
  );
}
