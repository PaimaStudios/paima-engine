import { ChainFunnel, ReadPresyncDataFrom, SubmittedData } from '@paima/runtime/src/types';
import {
  CdeMidnightContractStateDatum,
  ChainData,
  ChainDataExtensionDatum,
  InternalEvent,
  PresyncChainData,
} from '@paima/sm';
import {
  ChainDataExtensionDatumType,
  ConfigNetworkType,
  doLog,
  ENV,
  hexStringToUint8Array,
  logError,
} from '@paima/utils';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils';
import { PoolClient } from 'pg';
import { BaseFunnel, FunnelSharedData } from '../BaseFunnel.js';
import { MidnightConfig } from '@paima/utils';
import { ContractState, setNetworkId } from '@midnight-ntwrk/compact-runtime';
import { FunnelCacheEntry, MidnightFunnelCacheEntry } from '../FunnelCache.js';
import { composeChainData } from '../../utils.js';

// ----------------------------------------------------------------------------

// Interfaces approximated from GraphQL schema served by indexer v1.3.1

interface ContractCallOrDeploy {
  address: string;
  state: string;
  transaction: Transaction;
  zswapChainState: string;
}

interface ContractCall extends ContractCallOrDeploy {
  deploy: ContractCallOrDeploy;
  operation: string;
}

interface ContractDeploy extends ContractCallOrDeploy {
  definition: string;
}

interface Transaction {
  block: Block;
  hash: string;
  identifiers: string[];
  contractCalls: (ContractCall | ContractDeploy)[];
  raw: string;
  applyStage: string;
  merkleTreeRoot?: string;
}

interface Block {
  parent: Block;
  hash: string;
  height: number;
  timestamp: string;
  transactions: Transaction[];
}

function midnightTimestampToSeconds(timestamp: string): number {
  if (timestamp == '-1000000000-01-01T00:00:00Z') {
    // This is Midnight's block-zero timestamp.
    return 0;
  }

  // Perhaps attempting to constrain the timestamp format is not worth the effort?
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(timestamp))
    throw new Error('Bad timestamp format');

  return Math.floor(Date.parse(timestamp) / 1000);
}

// ----------------------------------------------------------------------------

// Future improvement: find out if the indexer supports any
// GraphQL-over-websocket transport and subscribe to new block events that way.

interface GraphQLErrorDetail {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: object;
}

class GraphQLError extends Error {
  errors?: GraphQLErrorDetail[];

  constructor(message: string, errors?: GraphQLErrorDetail[]) {
    super(message);
    this.errors = errors;
  }
}

async function gqlQuery(url: string, query: string): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      query,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    // GraphQL syntax errors etc. are 200s, this could be a 503 or similar
    throw new GraphQLError(`Server returned ${response.status} ${response.statusText}`);
  }
  const body = await response.json();
  if ('errors' in body) {
    throw new GraphQLError('Server returned errors', body.errors as GraphQLErrorDetail[]);
  }
  if ('data' in body) {
    return body.data;
  }
  throw new GraphQLError('Server returned nothing');
}

// ----------------------------------------------------------------------------

// Blocks are produced on devnet about every 6 seconds.

// Mina has a "confirmation depth" where only blocks N below the head are
// really confirmed. It seems like we don't have to handle that on Midnight.

type CachedBlock = Pick<Block, 'height' | 'hash' | 'timestamp'> & {
  transactions: (Pick<Transaction, 'hash'> & {
    contractCalls: Pick<ContractCall, 'address' | 'state'>[];
  })[];
};

class MidnightFunnel extends BaseFunnel implements ChainFunnel {
  constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    public chainName: string,
    private readonly baseFunnel: ChainFunnel,
    private config: MidnightConfig,
    private cache: MidnightFunnelCacheEntry
  ) {
    super(sharedData, dbTx);

    // Unfortunately this is global state so we can only connect to one network at a time.
    setNetworkId(config.networkId);
  }

  private async indexerQuery(query: string): Promise<unknown> {
    return await gqlQuery(this.config.indexer, query);
  }

  private async getTopBlock() {
    return (
      (await this.indexerQuery('query { block { hash, height, timestamp } }')) as {
        block: Pick<Block, 'hash' | 'height' | 'timestamp'>;
      }
    ).block;
  }

  private async getTimestampForBlock(at: number): Promise<number> {
    return midnightTimestampToSeconds(
      (
        (await this.indexerQuery(`query { block(offset: { height: ${at} }) { timestamp } }`)) as {
          block: Pick<Block, 'timestamp'>;
        }
      ).block.timestamp
    );
  }

  private async fetchBlock(height: number): Promise<CachedBlock | null> {
    return (
      (await this.indexerQuery(
        `query {
        block(offset: { height: ${height} }) {
          height
          hash
          timestamp
          transactions {
            hash
            contractCalls {
              address
              state
            }
          }
        }
      }`
      )) as {
        block: CachedBlock | null;
      }
    ).block;
  }

  private async waitForBlock(height: number): Promise<CachedBlock> {
    while (true) {
      const block = await this.fetchBlock(height);
      if (block) {
        return block;
      } else {
        // The next block doesn't exist yet, give it some time to appear.
        await new Promise(resolve => setTimeout(resolve, 3_000));
      }
    }
  }

  private extensionsFromBlock(
    baseBlockNumber: number,
    block: CachedBlock
  ): ChainDataExtensionDatum[] {
    const result = [];

    for (let tx of block.transactions) {
      for (let contractCall of tx.contractCalls) {
        const state = ContractState.deserialize(hexStringToUint8Array(contractCall.state));
        // We could downcast contractCall to see if operations() contains something useful.
        // For now let's report on the ledger variable contents.
        const jsState = state.data.encode();
        console.log('-- contract @', contractCall.address, 'has state', JSON.stringify(jsState));
        result.push({
          blockNumber: baseBlockNumber,
          transactionHash: tx.hash,

          cdeDatumType: ChainDataExtensionDatumType.MidnightContractState,
          cdeName: 'TODO', // TODO: filter on contract address being something we care about, thus learning CDE name
          network: `midnight:${this.config.networkId}`,

          // TODO: just combine contractState into payload?
          contractState: JSON.stringify(jsState),
          payload: null,
        } satisfies CdeMidnightContractStateDatum);
      }
    }

    return result;
  }

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [network: number]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    const baseDataPromise = this.baseFunnel.readPresyncData(args);

    const start = this.cache.nextBlockHeight;
    let block = await this.fetchBlock(this.cache.nextBlockHeight);
    if (!block) {
      // We're caught up. Return that we've finished.
      const baseData = await baseDataPromise;
      baseData[this.chainName] = FUNNEL_PRESYNC_FINISHED;
      return baseData;
    }

    const result: PresyncChainData[] = [];

    let lastLogTime = Date.now(),
      lastLogBlock = start;
    while (block) {
      const now = lastLogTime;
      if (lastLogTime - now > 5000) {
        console.log(
          `Midnight funnel ${this.config.networkId}: presync #${lastLogBlock}-${block.height}`
        );

        lastLogTime = now;
        lastLogBlock = block.height + 1;
      }

      this.cache.nextBlockHeight = block.height + 1;

      const extensionDatums = this.extensionsFromBlock(ENV.SM_START_BLOCKHEIGHT, block);
      if (extensionDatums.length) {
        result.push({
          network: `midnight:${this.config.networkId}`,
          networkType: ConfigNetworkType.MIDNIGHT,
          extensionDatums,
        });
      }

      block = await this.fetchBlock(this.cache.nextBlockHeight);
    }

    console.log(
      `Midnight funnel ${this.config.networkId}: finished presync #${start}-${this.cache.nextBlockHeight - 1}`
    );

    const baseData = await baseDataPromise;
    baseData[this.chainName] = result;
    return baseData;
  }

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    const baseData = await this.baseFunnel.readData(blockHeight);

    if (baseData.length === 0) {
      return baseData;
    }

    const result: {
      blockNumber: number;
      extensionDatums?: ChainDataExtensionDatum[];
      internalEvents?: InternalEvent[];
      submittedData?: SubmittedData[];
    }[] = [];
    let block = await this.waitForBlock(this.cache.nextBlockHeight);

    for (const baseBlock of baseData) {
      // Process all Midnight blocks that precede the base block.
      // Break when we've seen a block in the relative future.
      while (midnightTimestampToSeconds(block.timestamp) < baseBlock.timestamp) {
        // The meat: process this one.
        console.log(
          `Midnight funnel ${this.config.networkId}: base #${baseBlock.blockNumber} / Midnight #${block.height}`
        );

        const extensionDatums = this.extensionsFromBlock(baseBlock.blockNumber, block);
        if (extensionDatums.length) {
          result.push({
            blockNumber: baseBlock.blockNumber,
            extensionDatums,
          });
        }

        // Fetch next block.
        // TODO: Use WebSocket API (npm graphql-ws).
        // Even better, slurp an indexer's DB directly (but public indexers don't expose this).
        this.cache.nextBlockHeight = block.height + 1;
        block = await this.waitForBlock(this.cache.nextBlockHeight);
      }
    }

    // TODO: We could cache `block` instead of refetching it next time we're called.

    return composeChainData(baseData, result);
  }
}

export async function wrapToMidnightFunnel(
  chainFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  chainName: string,
  config: MidnightConfig
): Promise<ChainFunnel> {
  try {
    // Connect to the cache.
    const cache = (sharedData.cacheManager.cacheEntries[MidnightFunnelCacheEntry.SYMBOL] ??=
      new MidnightFunnelCacheEntry());
    return new MidnightFunnel(sharedData, dbTx, chainName, chainFunnel, config, cache);
  } catch (err) {
    // Log then rethrow???
    doLog('[paima-funnel] Unable to initialize Midnight cde events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize Midnight cde events processor');
  }
}
