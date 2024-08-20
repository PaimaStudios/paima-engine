import type Web3 from 'web3';
import type { BlockTransactionString } from 'web3-eth';
import type { PoolClient } from 'pg';
import {
  timeout,
  cutAfterFirstRejected,
  DEFAULT_FUNNEL_TIMEOUT,
  doLog,
  ChainDataExtensionType,
  getErc721Contract,
  ENV,
} from '@paima/utils';
import type { PaimaL2Contract, SubmittedData } from '@paima/utils';
import { TimeoutError, instantiateCdeGeneric } from '@paima/runtime';
import type { ChainDataExtension, TChainDataExtensionGenericConfig } from '@paima/sm';
import {
  CdeEntryTypeName,
  type CdeDynamicEvmPrimitiveDatum,
  type ChainData,
  type ChainDataExtensionDatum,
} from '@paima/sm';
import type { PaimaGameInteraction } from '@paima/utils';

import { extractSubmittedData } from './paima-l2-processing.js';
import type { FunnelSharedData } from './funnels/BaseFunnel.js';
import { getUngroupedCdeData } from './cde/reading.js';
import { generateDynamicPrimitiveName } from '@paima/utils-backend';
import type { ICdeBatcherPaymentUpdateBalanceParams } from '@paima/db';
import { cdeBatcherPaymentUpdateBalance } from '@paima/db';
import { BuiltinEvents } from '@paima/events';
import { PaimaEventManager } from '@paima/events';

export async function getBaseChainDataMulti(
  web3: Web3,
  paimaL2Contract: PaimaL2Contract,
  fromBlock: number,
  toBlock: number,
  DBConn: PoolClient,
  caip2Prefix: string
): Promise<ChainData[]> {
  const [blockData, events] = await Promise.all([
    getMultipleBlockData(web3, fromBlock, toBlock),
    getPaimaEvents(paimaL2Contract, fromBlock, toBlock),
  ]);
  const resultList: ChainData[] = [];
  for (const block of blockData) {
    const blockEvents = events.filter(e => e.blockNumber === block.blockNumber);

    const submittedData = await extractSubmittedData(
      blockEvents,
      block.timestamp,
      DBConn,
      caip2Prefix
    );

    if (ENV.BATCHER_PAYMENT_ENABLED) {
      await processBatcherPayments(web3, blockEvents, submittedData, DBConn);
    }

    resultList.push({
      ...block,
      submittedData,
    });
  }
  return resultList;
}

export async function getBaseChainDataSingle(
  web3: Web3,
  paimaL2Contract: PaimaL2Contract,
  blockNumber: number,
  DBConn: PoolClient,
  caip2Prefix: string
): Promise<ChainData> {
  const [blockData, events] = await Promise.all([
    getBlockData(web3, blockNumber),
    getPaimaEvents(paimaL2Contract, blockNumber, blockNumber),
  ]);

  const submittedData = await extractSubmittedData(
    events,
    blockData.timestamp,
    DBConn,
    caip2Prefix
  );

  if (ENV.BATCHER_PAYMENT_ENABLED) {
    await processBatcherPayments(web3, events, submittedData, DBConn);
  }
  return {
    ...blockData,
    submittedData, // merge in the data
  };
}

async function processBatcherPayments(
  web3: Web3,
  events: PaimaGameInteraction[],
  submittedData: (SubmittedData & { fromBatcher?: boolean })[],
  DBConn: PoolClient
): Promise<void> {
  const batcherSubmittedData = submittedData.filter(s => s.fromBatcher);
  if (batcherSubmittedData.length) {
    const totalGasUsed = await getTotalGas(web3, events);
    await splitGasCost(totalGasUsed, batcherSubmittedData, DBConn);
  }
}

async function getTotalGas(
  web3: Web3,
  blockEvents: PaimaGameInteraction[]
): Promise<{ gasUsed: number; txHash: string; batcherAddress: string }[]> {
  if (blockEvents.length === 0) return [];

  const transactionReceipts = await Promise.all(
    blockEvents.map(blockEvent => web3.eth.getTransactionReceipt(blockEvent.transactionHash))
  );
  return transactionReceipts.map(receipt => ({
    gasUsed: receipt.gasUsed * receipt.effectiveGasPrice,
    txHash: receipt.transactionHash,
    batcherAddress: receipt.from,
  }));
}

async function splitGasCost(
  totalGasUsed: { gasUsed: number; txHash: string; batcherAddress: string }[],
  batchedSubmittedData: SubmittedData[],
  DBConn: PoolClient
): Promise<void> {
  const operations: ICdeBatcherPaymentUpdateBalanceParams[] = [];
  totalGasUsed.forEach(g => {
    const submissions = batchedSubmittedData.filter(b => b.txHash === g.txHash);
    const weight = 1 / submissions.length;
    submissions.forEach(s =>
      operations.push({
        balance: -1 * weight * g.gasUsed,
        batcher_address: g.batcherAddress,
        cde_name: 'generic-batcher-contract',
        user_address: s.realAddress,
      })
    );
  });

  await Promise.all([
    ...operations.map(o => cdeBatcherPaymentUpdateBalance.run(o, DBConn)),
    ...operations.map(o =>
      PaimaEventManager.Instance.sendMessage(BuiltinEvents.BatcherPayment, {
        userAddress: o.user_address,
        batcherAddress: o.batcher_address,
        operation: 'payGas',
        wei: String(-1 * (o.balance as number)),
      })
    ),
  ]);
}

async function getBlockData(web3: Web3, blockNumber: number): Promise<ChainData> {
  const block = await timeout(web3.eth.getBlock(blockNumber), DEFAULT_FUNNEL_TIMEOUT);
  if (block == null) {
    throw new Error(
      `Unable to find block number ${blockNumber}. Perhaps it no long exists due to a rollback or load-balancing`
    );
  }
  return blockDataToChainData(block);
}

function blockDataToChainData(block: BlockTransactionString): ChainData {
  const timestamp =
    typeof block.timestamp === 'string' ? parseInt(block.timestamp, 10) : block.timestamp;
  return {
    timestamp: timestamp,
    blockHash: block.hash,
    blockNumber: block.number,
    submittedData: [], // this will be merged in after
  };
}

export async function getMultipleBlockData(
  web3: Web3,
  fromBlock: number,
  toBlock: number
): Promise<ChainData[]> {
  const batch = new web3.BatchRequest();

  const blockRange = Array.from({ length: toBlock - fromBlock + 1 }, (_, i) => i + fromBlock);
  const blockPromises = blockRange.map(blockNumber => {
    return new Promise<ChainData>((resolve, reject) => {
      batch.add(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: web3-eth v1 is missing this in its type definitions
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        web3.eth.getBlock.request(blockNumber, (error, result: BlockTransactionString) => {
          if (error) reject(error);
          else resolve(blockDataToChainData(result));
        })
      );
    });
  });

  batch.execute(); // this isn't async in web3 v1. It is async in v4 though
  const blockResults = await Promise.allSettled(blockPromises);
  const truncatedList = cutAfterFirstRejected(blockResults);

  // return the first rejection if all rejections failed
  // this is to fast-fail if all requests failed
  // which matches the behavior of `getBaseChainDataSingle`
  if (truncatedList.length === 0 && blockResults.length > 0) {
    doLog(`[funnel] all block requests failed`);
    const reason = (blockResults[0] as PromiseRejectedResult).reason;
    if (reason instanceof Error && reason.message === 'Invalid JSON RPC response: {}') {
      // this error often happens on Aribtrum's RPC endpoint. It seems to maybe be a bug in handling batched requests
      // where rate limit errors for batch requests instead just get converted to {}
      // that then maybe throws an error due to https://github.com/web3/web3.js/blob/1.x/packages/web3-core-requestmanager/src/index.js#L207
      const timeout = 60 * 1000; // 1 minute - the time of Arbitrum's rate limit. Not sure if other chains might have a different limit time
      throw new TimeoutError(
        '[funnel] Public RPC Rate Limit Hit, limit will reset in 60 seconds',
        timeout
      );
    }
    // Promise.allSettled returns Error objects so we have to rethrow promises that failed
    throw (blockResults[0] as PromiseRejectedResult).reason;
  }
  return truncatedList;
}

async function getPaimaEvents(
  paimaL2Contract: PaimaL2Contract,
  fromBlock: number,
  toBlock: number
): Promise<PaimaGameInteraction[]> {
  // TODO: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  return (await timeout(
    paimaL2Contract.getPastEvents('PaimaGameInteraction', {
      fromBlock,
      toBlock,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as PaimaGameInteraction[];
}

// We need to fetch these before the rest of the primitives, because this may
// change the set of primitives. Otherwise we would miss the events for those.
// If there is an event that triggers a dynamic primitive here, then an
// extension will be added to the list with a starting block at that point.
export async function fetchDynamicEvmPrimitives(
  fromBlock: number,
  toBlock: number,
  web3: Web3,
  sharedData: FunnelSharedData,
  network: string
): Promise<ChainDataExtensionDatum[][]> {
  const filteredExtensions = sharedData.extensions.filter(
    extension =>
      extension.network === network &&
      extension.cdeType === ChainDataExtensionType.DynamicEvmPrimitive
  );

  const DynamicEvmPrimitives = await getUngroupedCdeData(
    web3,
    filteredExtensions,
    fromBlock,
    toBlock,
    network
  );

  for (const exts of DynamicEvmPrimitives) {
    for (const _ext of exts) {
      const ext: CdeDynamicEvmPrimitiveDatum = _ext as CdeDynamicEvmPrimitiveDatum;

      const id = sharedData.extensions.filter(
        e =>
          e.cdeType !== ChainDataExtensionType.DynamicEvmPrimitive &&
          e.cdeName.startsWith(ext.cdeName)
      ).length;

      const cdeName = generateDynamicPrimitiveName(ext.cdeName, id);

      // this would propagate the change to further funnels in the pipeline,
      // which is needed to set the proper cdeName.
      switch (ext.payload.targetConfig.type) {
        case CdeEntryTypeName.ERC721:
          sharedData.extensions.push({
            cdeName: cdeName,
            name: cdeName,
            startBlockHeight: ext.blockNumber,
            type: ext.payload.targetConfig.type,
            contractAddress: ext.payload.contractAddress,
            scheduledPrefix: ext.payload.targetConfig.scheduledPrefix,
            burnScheduledPrefix: ext.payload.targetConfig.burnScheduledPrefix,
            // not relevant
            hash: 0,
            cdeType: ChainDataExtensionType.ERC721,
            contract: getErc721Contract(ext.payload.contractAddress, web3),
            network: ext.network,
          });
          break;
        case CdeEntryTypeName.Generic:
          const config: TChainDataExtensionGenericConfig = {
            startBlockHeight: ext.blockNumber,
            name: cdeName,
            contractAddress: ext.payload.contractAddress,
            ...ext.payload.targetConfig,
          };

          const instantiatedGenericExtension: ChainDataExtension = {
            ...(await instantiateCdeGeneric(config, web3)),
            network,
          };

          sharedData.extensions.push(instantiatedGenericExtension);
          break;
      }
    }
  }

  return DynamicEvmPrimitives;
}
