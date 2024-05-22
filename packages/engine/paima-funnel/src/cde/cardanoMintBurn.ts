import type { CdeCardanoMintBurnDatum, ChainDataExtensionCardanoMintBurn } from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import { Routes, query } from '@dcspark/carp-client';
import type { BlockTxPair } from '@dcspark/carp-client';
import type { MintBurnHistoryResponse } from '@dcspark/carp-client';

export default async function getCdeData(
  url: string,
  extension: ChainDataExtensionCardanoMintBurn,
  fromAbsoluteSlot: number,
  toAbsoluteSlot: number,
  getBlockNumber: (slot: number) => number,
  // if we are in the presync phase, we don't care about the slots since we
  // don't need to deterministically pair this with the evm blocks, so in this
  // case we only fetch one page and break.
  isPresync: boolean,
  untilBlock: string,
  // only should be used during the presync phase, to be able to resume from the
  // previous point
  fromTx: BlockTxPair | undefined,
  paginationLimit: number,
  network: string
): Promise<CdeCardanoMintBurnDatum[]> {
  let result = [] as CdeCardanoMintBurnDatum[];

  while (true) {
    const events = await timeout(
      query(url, Routes.mintBurnHistory, {
        policyIds: extension.policyIds,
        slotLimits: {
          from: fromAbsoluteSlot,
          to: toAbsoluteSlot,
        },
        limit: paginationLimit,
        untilBlock,
        after: fromTx,
      }),
      DEFAULT_FUNNEL_TIMEOUT
    );

    if (events.length > 0) {
      const last = events[events.length - 1];

      fromTx = {
        tx: last.txId,
        block: last.block,
      };
    }

    events
      .map(e => eventToCdeDatum(e, extension, getBlockNumber(e.actionSlot), network))
      .forEach(element => {
        result.push(element);
      });

    if (events.length === 0 || isPresync) {
      break;
    }
  }

  return result;
}

function eventToCdeDatum(
  event: MintBurnHistoryResponse[0],
  extension: ChainDataExtensionCardanoMintBurn,
  blockNumber: number,
  network: string
): CdeCardanoMintBurnDatum {
  const cursor: BlockTxPair = {
    block: event.block,
    tx: event.txId,
  };

  return {
    cdeName: extension.cdeName,
    cdeDatumType: ChainDataExtensionDatumType.CardanoMintBurn,
    blockNumber,
    payload: {
      txId: event.txId,
      metadata: event.metadata,
      assets: event.assets,
      inputAddresses: event.inputAddresses,
      outputAddresses: event.outputAddresses,
    },
    scheduledPrefix: extension.scheduledPrefix,
    paginationCursor: { cursor: JSON.stringify(cursor), finished: false },
    network,
  };
}
