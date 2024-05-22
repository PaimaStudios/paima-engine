import type { CdeCardanoTransferDatum, ChainDataExtensionCardanoTransfer } from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import { Routes, query } from '@dcspark/carp-client';
import type { TxAndBlockInfo } from '@dcspark/carp-client';
import { Transaction } from '@dcspark/cardano-multiplatform-lib-nodejs';
import type { BlockTxPair } from '@dcspark/carp-client';
import { RelationFilterType } from '@dcspark/carp-client';

export default async function getCdeData(
  url: string,
  extension: ChainDataExtensionCardanoTransfer,
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
): Promise<CdeCardanoTransferDatum[]> {
  let result = [] as CdeCardanoTransferDatum[];

  const relationFilter = RelationFilterType.Output | RelationFilterType.Witness;

  while (true) {
    const event = await timeout(
      query(url, Routes.transactionHistory, {
        relationFilter,
        addresses: [extension.credential],
        slotLimits: {
          from: fromAbsoluteSlot,
          to: toAbsoluteSlot,
        },
        limit: paginationLimit,
        untilBlock,
        after: fromTx,
        withInputContext: true,
      }),
      DEFAULT_FUNNEL_TIMEOUT
    );

    const transactions = event.transactions;

    if (transactions.length > 0) {
      const last = transactions[transactions.length - 1];

      fromTx = {
        tx: last.transaction.hash,
        block: last.block.hash,
      };
    }

    transactions
      .map(e => eventToCdeDatum(e, extension, getBlockNumber(e.block.slot), network))
      .forEach(element => {
        result.push(element);
      });

    if (transactions.length === 0 || isPresync) {
      break;
    }
  }

  return result;
}

function eventToCdeDatum(
  event: TxAndBlockInfo,
  extension: ChainDataExtensionCardanoTransfer,
  blockNumber: number,
  network: string
): CdeCardanoTransferDatum {
  const cursor: BlockTxPair = {
    block: event.block.hash,
    tx: event.transaction.hash,
  };

  const outputs = computeOutputs(event.transaction.payload);

  return {
    cdeName: extension.cdeName,
    cdeDatumType: ChainDataExtensionDatumType.CardanoTransfer,
    blockNumber,
    payload: {
      rawTx: event.transaction.payload,
      txId: event.transaction.hash,
      outputs,
      inputCredentials: event.transaction.inputCredentials || [],
      metadata: event.transaction.metadata || null,
    },
    scheduledPrefix: extension.scheduledPrefix,
    paginationCursor: { cursor: JSON.stringify(cursor), finished: false },
    network,
  };
}

function computeOutputs(
  tx: string
): { asset: { policyId: string; assetName: string } | null; amount: string; address: string }[] {
  const transaction = Transaction.from_cbor_hex(tx);

  const rawOutputs = transaction.body().outputs();

  const outputs = [];

  for (let i = 0; i < rawOutputs.len(); i++) {
    const output = rawOutputs.get(i);

    const rawAddress = output.address();
    const address = rawAddress.to_bech32();

    const amount = output.amount();
    const ma = amount.multi_asset();

    if (ma) {
      const policyIds = ma.keys();

      for (let j = 0; j < policyIds.len(); j++) {
        const policyId = policyIds.get(j);

        const assets = ma.get_assets(policyId);

        if (!assets) {
          continue;
        }

        const assetNames = assets.keys();

        for (let k = 0; k < assetNames.len(); k++) {
          const assetName = assetNames.get(k);

          const amount = assets.get(assetName);

          if (amount === undefined) {
            continue;
          }

          outputs.push({
            amount: amount.toString(),
            asset: {
              policyId: policyId.to_hex(),
              assetName: Buffer.from(assetName.to_cbor_bytes()).toString('hex'),
            },
            address,
          });
        }
      }
    }

    outputs.push({ amount: amount.coin().toString(), asset: null, address });
  }

  return outputs;
}
