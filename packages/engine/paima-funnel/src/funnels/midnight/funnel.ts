import { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime/src/types';
import { ChainData, PresyncChainData } from '@paima/sm';
import { doLog, hexStringToUint8Array, logError } from '@paima/utils';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils';
import { PoolClient } from 'pg';
import { BaseFunnel, FunnelSharedData } from '../BaseFunnel.js';
import { MidnightConfig } from '@paima/utils';
import { ContractState, setNetworkId } from '@midnight-ntwrk/compact-runtime';

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
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(timestamp))
    throw new Error('Bad timestamp format');
  return Date.parse(timestamp) / 1000;
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
  });
  const body = await response.json();
  if ('errors' in response) {
    throw new GraphQLError('Server returned errors', response.errors as GraphQLErrorDetail[]);
  }
  if ('data' in response) {
    return response.data;
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
  // Linear queue of blocks.
  private cachedBlocks: CachedBlock[] = [];
  private nextBlockHeight: number = 588881;

  //private pdp: PublicDataProvider;

  constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    public chainName: string,
    private readonly baseFunnel: ChainFunnel,
    private config: MidnightConfig
  ) {
    super(sharedData, dbTx);

    setNetworkId(1); // TODO: 1 = DevNet probably shouldn't be hardcoded
  }

  private async indexerQuery(query: string): Promise<unknown> {
    return await gqlQuery(`${this.config.indexer}/api/v1/graphql`, query);
  }

  async derp() {
    const topBlock = (
      (await this.indexerQuery('block { hash, height, timestamp }')) as {
        block: Pick<Block, 'hash' | 'height' | 'timestamp'>;
      }
    ).block;
  }

  async getTimestampForBlock(at: number): Promise<number> {
    return midnightTimestampToSeconds(
      (
        (await this.indexerQuery(`block(offset: { height: ${at} }) { timestamp }`)) as {
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

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    const baseData = await this.baseFunnel.readData(blockHeight);

    if (baseData.length === 0) {
      return baseData;
    }

    const targetTimestamp = baseData[0].timestamp;
    const result: ChainData[] = [];

    let cacheIdx = 0;
    while (true) {
      // Drain the cache.
      if (cacheIdx < this.cachedBlocks.length) {
        const block = this.cachedBlocks[cacheIdx];
        const blockTimestamp = midnightTimestampToSeconds(block.timestamp);
        if (blockTimestamp >= targetTimestamp) {
          // We've seen a block in the future from our target timestamp.
          // The relative past is now known, so break out.
          break;
        }
        ++cacheIdx;

        // The meat: process this one.
        console.log('Midnight accepted block', block.transactions.length, block);
        for (let tx of block.transactions) {
          for (let contractCall of tx.contractCalls) {
            let state = ContractState.deserialize(hexStringToUint8Array(contractCall.state));
            console.log('-- addr =', contractCall.address, ', state = ', state);
          }
        }
      }

      // Fill the cache.
      console.log('Midnight requesting block', this.nextBlockHeight);
      const { block } = (await this.indexerQuery(
        `block(offset: { height: ${this.nextBlockHeight} }) {
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
        }`
      )) as {
        block: CachedBlock | null;
      };
      if (block) {
        this.cachedBlocks.push(block);
        this.nextBlockHeight = block.height + 1;
      } else {
        // The next block doesn't exist yet, give it three seconds to come around.
        await new Promise(resolve => setTimeout(resolve, 3_000));
      }
    }

    // Lop off everything we processed already.
    this.cachedBlocks.splice(0, cacheIdx);

    return result;
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
    // TODO: Recover the cache state...
    // Hooray!
    return new MidnightFunnel(sharedData, dbTx, chainName, chainFunnel, config);
  } catch (err) {
    // Log then rethrow???
    doLog('[paima-funnel] Unable to initialize Midnight cde events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize Midnight cde events processor');
  }
}
