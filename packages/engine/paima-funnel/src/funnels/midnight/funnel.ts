import { ChainFunnel, ReadPresyncDataFrom, SubmittedData } from '@paima/runtime/src/types';
import {
  CdeMidnightContractStateDatum,
  ChainData,
  ChainDataExtension,
  ChainDataExtensionDatum,
  ChainDataExtensionMidnightContractState,
  InternalEvent,
  PresyncChainData,
} from '@paima/sm';
import {
  ChainDataExtensionDatumType,
  ChainDataExtensionType,
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
import { FunnelCacheEntry } from '../FunnelCache.js';
import { composeChainData } from '../../utils.js';
import { Client, createClient, ExecutionResult } from 'graphql-ws';
import { WebSocket } from 'ws';

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

function handleGqlWsError<T>(ex: IteratorResult<ExecutionResult<T, unknown>, unknown>): T {
  if (ex.done) throw new GraphQLError('Subscription ended');
  if (ex.value.errors) throw ex.value.errors;
  if (!ex.value.data) throw new GraphQLError('Server returned nothing');
  return ex.value.data;
}

// ----------------------------------------------------------------------------

// Blocks are produced on devnet about every 6 seconds.

// Mina has a "confirmation depth" where only blocks N below the head are
// really confirmed. It seems like we don't have to handle that on Midnight.

function defaultIndexerWs(indexer: string): string {
  const url = new URL(indexer);
  url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:';
  url.pathname += '/ws';
  return url.toString();
}

type CachedBlock = Pick<Block, 'height' | 'hash' | 'timestamp'> & {
  transactions: (Pick<Transaction, 'hash'> & {
    contractCalls: Pick<ContractCall, 'address' | 'state'>[];
  })[];
};
const cachedBlockQuery = `
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
`;

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
          ${cachedBlockQuery}
        }
      }`
      )) as {
        block: CachedBlock | null;
      }
    ).block;
  }

  private async waitForBlock(height: number): Promise<CachedBlock> {
    while (true) {
      while (this.cache.wsBlocks.length < 1) {
        // ^ The above 1 could be changed to some other number of blocks that
        // must be buffered before we process them.
        this.cache.wsBlocks.push(handleGqlWsError(await this.cache.iter.next()).blocks);
        // ^ Hovers around 5.4ish to 6.6ish second wait per block. Nominal block time is 6s.
      }

      const nextBlock = this.cache.wsBlocks[0];

      if (height < nextBlock.height) {
        const oldBlock = await this.fetchBlock(height);
        if (!oldBlock) {
          throw new Error(`Saw block ${nextBlock.height}, but old block ${height} doesn't exist!`);
        }
        return oldBlock;
      } else if (height == nextBlock.height) {
        this.cache.wsBlocks.splice(0, 1);
        return nextBlock;
      } else {
        this.cache.wsBlocks.splice(0, 1);
      }
    }
  }

  private extensionsFromBlock(
    baseBlockNumber: number,
    block: CachedBlock
  ): ChainDataExtensionDatum[] {
    const result = [];

    const contractAddressToCdeName = new Map(
      this.sharedData.extensions.flatMap(ext =>
        ext.network === this.chainName &&
        ext.cdeType === ChainDataExtensionType.MidnightContractState
          ? [[ext.contractAddress, ext.cdeName]]
          : []
      )
    );

    for (let tx of block.transactions) {
      for (let contractCall of tx.contractCalls) {
        const cdeName = contractAddressToCdeName.get(contractCall.address);
        if (cdeName) {
          // Only deserialize if we actually care.
          const state = ContractState.deserialize(hexStringToUint8Array(contractCall.state));
          // We could downcast contractCall to see if operations() contains something useful.
          // For now let's report on the ledger variable contents.
          const jsState = state.data.encode();
          console.log(
            '-- cde',
            cdeName,
            'contract @',
            contractCall.address,
            'has state',
            JSON.stringify(jsState)
          );

          result.push({
            blockNumber: baseBlockNumber,
            transactionHash: tx.hash,

            cdeDatumType: ChainDataExtensionDatumType.MidnightContractState,
            cdeName,
            network: this.chainName,

            // TODO: just combine contractState into payload?
            contractState: JSON.stringify(jsState),
            payload: null,
          } satisfies CdeMidnightContractStateDatum);
        } else {
          console.log('discarding contract @', contractCall.address);
        }
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
      const now = Date.now();
      if (now - lastLogTime > 5000) {
        console.log(
          `Midnight funnel ${this.config.networkId}: presync #${lastLogBlock}-${block.height}`
        );

        lastLogTime = now;
        lastLogBlock = block.height + 1;
      }

      // TODO: break if this timestamp exceeds main chain START_BLOCKHEIGHT timestamp minus confirmation depth

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

export class MidnightFunnelCacheEntry implements FunnelCacheEntry {
  static readonly SYMBOL = Symbol('MidnightFunnelCacheEntry');

  /** Lowest Midnight block height that has not been processed by the funnel. */
  nextBlockHeight: number = 0;

  // WebSocket connection for being notified of new blocks.
  wsClient: Client;
  iter: AsyncIterableIterator<ExecutionResult<{ blocks: CachedBlock }, unknown>>;
  wsBlocks: CachedBlock[];

  constructor(config: MidnightConfig) {
    this.wsClient = createClient({
      url: config.indexerWS ?? defaultIndexerWs(config.indexer),
      webSocketImpl: WebSocket,
    });

    this.iter = this.wsClient.iterate<{ blocks: CachedBlock }>({
      query: `subscription { blocks { ${cachedBlockQuery} } }`,
    });
    this.wsBlocks = [];
  }

  clear() {
    this.nextBlockHeight = 0;
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
      new MidnightFunnelCacheEntry(config));
    return new MidnightFunnel(sharedData, dbTx, chainName, chainFunnel, config, cache);
  } catch (err) {
    // Log then rethrow???
    doLog('[paima-funnel] Unable to initialize Midnight cde events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize Midnight cde events processor');
  }
}
