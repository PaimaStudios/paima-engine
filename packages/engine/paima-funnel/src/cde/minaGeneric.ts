import {
  CdeMinaGenericDatum,
  ChainDataExtensionDatum,
  ChainDataExtensionMinaGeneric,
} from '@paima/sm';
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
  const data = (await fetch(minaArchive, {
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
        }
      `,
    }),
  })
    .then(res => res.json())
    .then(res => {
      return res;
    })
    .then(json => json['data']['events'])) as {
    blockInfo: { height: number; timestamp: string };
    eventData: { data: string[] }[];
  }[];

  return data.flatMap(singleBlockData =>
    singleBlockData.eventData.flatMap(perTx =>
      perTx.data.map(txEvent => ({
        cdeId: extension.cdeId,
        cdeDatumType: ChainDataExtensionDatumType.MinaGeneric,
        blockNumber: getBlockNumber(Number.parseInt(singleBlockData.blockInfo.timestamp, 10)),
        payload: txEvent,
        network,
        scheduledPrefix: extension.scheduledPrefix,
        paginationCursor: { cursor: singleBlockData.blockInfo.timestamp, finished: false },
      }))
    )
  );
}
