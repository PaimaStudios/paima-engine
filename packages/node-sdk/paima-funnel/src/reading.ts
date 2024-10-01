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
  caip2PrefixFor,
} from '@paima/utils';
import type { MainEvmConfig, OtherEvmConfig, PaimaL2Contract } from '@paima/utils';
import { TimeoutError, instantiateCdeGeneric } from '@paima/runtime';
import type { ChainDataExtension, EvmChainDataExtensionDatum } from '@paima/sm';
import {
  type CdeDynamicEvmPrimitiveDatum,
  type ChainData,
} from '@paima/sm';
import type { PaimaGameInteraction } from '@paima/utils';

import { extractSubmittedData } from './paima-l2-processing.js';
import type { FunnelSharedData } from './funnels/BaseFunnel.js';
import { getUngroupedCdeData } from './cde/reading.js';
import { generateDynamicPrimitiveName } from '@paima/utils-backend';
import type { ChainInfo } from './utils.js';
import type { TChainDataExtensionGenericConfig } from '@paima/config';
import { ConfigPrimitiveType } from '@paima/config';

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
  return {
    ...blockData,
    submittedData, // merge in the data
  };
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
  chainInfo: ChainInfo<MainEvmConfig | OtherEvmConfig>
): Promise<EvmChainDataExtensionDatum[][]> {
  const filteredExtensions = sharedData.extensions.filter(
    extension =>
      extension.network === chainInfo.name &&
      extension.cdeType === ChainDataExtensionType.DynamicEvmPrimitive
  );

  const caip2 = caip2PrefixFor(chainInfo.config);
  const DynamicEvmPrimitives = await getUngroupedCdeData(
    web3,
    filteredExtensions,
    fromBlock,
    toBlock,
    caip2
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
        case ConfigPrimitiveType.ERC721:
          sharedData.extensions.push({
            cdeName: cdeName,
            displayName: cdeName,
            startBlockHeight: ext.blockNumber,
            type: ext.payload.targetConfig.type,
            contractAddress: ext.payload.contractAddress.toLowerCase(),
            scheduledPrefix: ext.payload.targetConfig.scheduledPrefix,
            burnScheduledPrefix: ext.payload.targetConfig.burnScheduledPrefix,
            // not relevant
            hash: 0,
            cdeType: ChainDataExtensionType.ERC721,
            contract: getErc721Contract(ext.payload.contractAddress, web3),
            network: chainInfo.name,
          });
          break;
        case ConfigPrimitiveType.Generic:
          const config: TChainDataExtensionGenericConfig = {
            startBlockHeight: ext.blockNumber,
            displayName: cdeName,
            contractAddress: ext.payload.contractAddress.toLowerCase(),
            ...ext.payload.targetConfig,
          };

          const instantiatedGenericExtension: ChainDataExtension = {
            ...(await instantiateCdeGeneric(config, web3)),
            network: chainInfo.name,
          };

          sharedData.extensions.push(instantiatedGenericExtension);
          break;
      }
    }
  }

  return DynamicEvmPrimitives;
}
