import { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime/src/types';
import { ChainData, PresyncChainData } from '@paima/sm';
import { doLog, hexStringToUint8Array, logError } from '@paima/utils';
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

    setNetworkId(1); // TODO: 1 = DevNet probably shouldn't be hardcoded
    // Also, it's unfortunate that it's global state.
  }

  private async indexerQuery(query: string): Promise<unknown> {
    return await gqlQuery(this.config.indexer, query);
  }

  async derp() {
    const topBlock = (
      (await this.indexerQuery('query { block { hash, height, timestamp } }')) as {
        block: Pick<Block, 'hash' | 'height' | 'timestamp'>;
      }
    ).block;
  }

  async getTimestampForBlock(at: number): Promise<number> {
    return midnightTimestampToSeconds(
      (
        (await this.indexerQuery(`query { block(offset: { height: ${at} }) { timestamp } }`)) as {
          block: Pick<Block, 'timestamp'>;
        }
      ).block.timestamp
    );
  }

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [network: number]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    const baseData = await this.baseFunnel.readPresyncData(args);

    baseData[this.chainName] = FUNNEL_PRESYNC_FINISHED;

    return baseData;
  }

  private async waitForBlock(height: number): Promise<CachedBlock> {
    while (true) {
      const { block } = (await this.indexerQuery(
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
      };
      if (block) {
        return block;
      } else {
        // The next block doesn't exist yet, give it some time to appear.
        await new Promise(resolve => setTimeout(resolve, 3_000));
      }
    }
  }

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    const baseData = await this.baseFunnel.readData(blockHeight);

    if (baseData.length === 0) {
      return baseData;
    }

    const targetTimestamp = baseData[0].timestamp;
    const result: ChainData[] = [];

    // TODO: this might be more GraphQL traffic than strictly necessary.
    // We could cache the "next" block better.
    // Even better, slurp an indexer's DB directly (but public indexers don't expose this).

    while (true) {
      // Fetch 'next' block.
      const block = await this.waitForBlock(this.cache.nextBlockHeight);
      const blockTimestamp = midnightTimestampToSeconds(block.timestamp);
      if (blockTimestamp >= targetTimestamp) {
        // We've seen a block in the future from our target timestamp.
        // The relative past is now known, so break out.
        break;
      }

      // The meat: process this one.
      console.log(
        'Midnight accepted block',
        '#',
        block.height,
        'txns',
        block.transactions.length,
        block
      );
      for (let tx of block.transactions) {
        for (let contractCall of tx.contractCalls) {
          let state = ContractState.deserialize(hexStringToUint8Array(contractCall.state));
          console.log('-- addr =', contractCall.address, ', state = ', state);
        }
      }

      this.cache.nextBlockHeight = block.height + 1;
    }

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
