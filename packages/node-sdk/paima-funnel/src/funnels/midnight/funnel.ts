import { ContractState, setNetworkId } from '@midnight-ntwrk/compact-runtime';
import { getMidnightCheckpoint } from '@paima/db';
import type { ChainFunnel, FunnelJson, ReadPresyncDataFrom, SubmittedData } from '@paima/runtime';
import type {
  CdeMidnightContractStateDatum,
  ChainData,
  ChainDataExtensionDatum,
  InternalEvent,
  PresyncChainData,
} from '@paima/sm';
import type { MidnightConfig } from '@paima/utils';
import {
  ChainDataExtensionDatumType,
  ChainDataExtensionType,
  ConfigNetworkType,
  doLog,
  ENV,
  FUNNEL_PRESYNC_FINISHED,
  hexStringToUint8Array,
  InternalEventType,
  logError,
} from '@paima/utils';
import { type Client, createClient, type ExecutionResult } from 'graphql-ws';
import type { PoolClient } from 'pg';
import { WebSocket } from 'ws';
import { type ChainInfo, composeChainData } from '../../utils.js';
import { BaseFunnel, type FunnelSharedData } from '../BaseFunnel.js';
import type { FunnelCacheEntry } from '../FunnelCache.js';

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
  if (timestamp === '-1000000000-01-01T00:00:00Z') {
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
  locations?: readonly { line: number; column: number }[];
  path?: readonly (string | number)[];
  extensions?: object;
}

class GraphQLError extends Error {
  errors?: readonly GraphQLErrorDetail[];

  constructor(message: string, errors?: readonly GraphQLErrorDetail[]) {
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
  if (ex.value.errors) throw new GraphQLError('Subscription errored', ex.value.errors);
  if (!ex.value.data) throw new GraphQLError('Server returned nothing');
  return ex.value.data;
}

// ----------------------------------------------------------------------------

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
  private readonly caip2: string;

  constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    public chainInfo: ChainInfo<MidnightConfig>,
    private readonly baseFunnel: ChainFunnel,
    private cache: MidnightFunnelCacheEntry
  ) {
    super(sharedData, dbTx);

    this.caip2 = caip2PrefixFor(chainInfo.config);
  }

  private async indexerQuery(query: string): Promise<unknown> {
    return await gqlQuery(this.chainInfo.config.indexer, query);
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
      while (
        this.cache.wsBlocks.length < 1 ||
        height >
          this.cache.wsBlocks[this.cache.wsBlocks.length - 1].height -
            this.chainInfo.config.confirmationDepth
      ) {
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
    const result: CdeMidnightContractStateDatum[] = [];

    const contractAddressToExtension = new Map(
      this.sharedData.extensions.flatMap(ext =>
        ext.network === this.chainInfo.name &&
        ext.cdeType === ChainDataExtensionType.MidnightContractState
          ? [[ext.contractAddress, ext]]
          : []
      )
    );

    for (let tx of block.transactions) {
      for (let contractCall of tx.contractCalls) {
        const extension = contractAddressToExtension.get(contractCall.address);
        if (extension) {
          // Only deserialize if we actually care.
          setNetworkId(this.chainInfo.config.networkId);
          const state = ContractState.deserialize(hexStringToUint8Array(contractCall.state));
          // We could downcast contractCall to see if operations() contains something useful.
          // For now let's report on the ledger variable contents.
          const jsState = state.data.encode();

          result.push({
            blockNumber: baseBlockNumber,
            transactionHash: tx.hash,

            cdeDatumType: ChainDataExtensionDatumType.MidnightContractState,
            cdeName: extension.cdeName,
            contractAddress: contractCall.address,
            caip2: this.caip2,

            scheduledPrefix: extension.scheduledPrefix,
            payload: JSON.stringify(jsState),
          });
        }
      }
    }

    return result;
  }

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [caip2: string]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    const baseDataPromise = this.baseFunnel.readPresyncData(args);

    const startingBlock = await this.sharedData.mainNetworkApi.getStartingBlock();
    if (!startingBlock) {
      throw new Error("Couldn't get main's network staring block timestamp");
    }

    const start = this.cache.nextBlockHeight;
    let block = await this.fetchBlock(this.cache.nextBlockHeight);
    if (!(block && midnightTimestampToSeconds(block.timestamp) < startingBlock.timestamp)) {
      // We're caught up. Return that we've finished.
      const baseData = await baseDataPromise;
      baseData[this.caip2] = FUNNEL_PRESYNC_FINISHED;
      return baseData;
    }

    const result: PresyncChainData[] = [];

    let lastLogTime = Date.now(),
      lastLogBlock = start;
    // TODO: apply confirmation depth here
    while (block && midnightTimestampToSeconds(block.timestamp) < startingBlock.timestamp) {
      const now = Date.now();
      if (now - lastLogTime > 5000) {
        console.log(
          `Midnight funnel ${this.chainInfo.config.networkId}: presync #${lastLogBlock}-${block.height}`
        );

        lastLogTime = now;
        lastLogBlock = block.height + 1;
      }

      this.cache.nextBlockHeight = block.height + 1;

      // Note: ENV.START_BLOCKHEIGHT here is eventually ignored by the `inPresync?` check
      // in `processMidnightContractStateDatum` that actually creates scheduled inputs.
      const extensionDatums = this.extensionsFromBlock(ENV.START_BLOCKHEIGHT, block);
      if (extensionDatums.length) {
        result.push({
          caip2: this.caip2,
          networkType: ConfigNetworkType.MIDNIGHT,
          extensionDatums,
        });
      }

      block = await this.fetchBlock(this.cache.nextBlockHeight);
    }

    console.log(
      `Midnight funnel ${this.chainInfo.config.networkId}: finished presync #${start}-${this.cache.nextBlockHeight - 1}`
    );

    const baseData = await baseDataPromise;
    baseData[this.caip2] = result;
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

    const baseBlockToMidnightBlock = new Map<number, number>();

    for (const baseBlock of baseData) {
      // Process all Midnight blocks that precede the base block.
      // Break when we've seen a block in the relative future.
      // TODO: apply confirmation depth here.
      while (midnightTimestampToSeconds(block.timestamp) < baseBlock.timestamp) {
        // The meat: process this one.
        console.log(
          `Midnight funnel ${this.chainInfo.config.networkId}: base #${baseBlock.blockNumber} / Midnight #${block.height}`
        );

        const extensionDatums = this.extensionsFromBlock(baseBlock.blockNumber, block);
        if (extensionDatums.length) {
          result.push({
            blockNumber: baseBlock.blockNumber,
            extensionDatums,
          });
        }

        baseBlockToMidnightBlock.set(baseBlock.blockNumber, block.height);

        // Fetch next block.
        this.cache.nextBlockHeight = block.height + 1;
        block = await this.waitForBlock(this.cache.nextBlockHeight);
      }
    }

    // Insert the internal MidnightLastBlock event into each ChainData.
    const composed = composeChainData(baseData, result);
    for (const chainData of composed) {
      const midnightBlock = baseBlockToMidnightBlock.get(chainData.blockNumber);
      if (midnightBlock) {
        (chainData.internalEvents ??= []).push({
          type: InternalEventType.MidnightLastBlock,
          caip2: this.caip2,
          block: midnightBlock,
        });
      }
    }
    return composed;
  }

  public override configPrint(): FunnelJson {
    return {
      type: 'MidnightFunnel',
      chainName: this.chainInfo.name,
      child: this.baseFunnel.configPrint(),
    };
  }
}

export class MidnightFunnelCacheEntry implements FunnelCacheEntry {
  static readonly SYMBOL = Symbol('MidnightFunnelCacheEntry');

  caip2: string;

  /** Lowest Midnight block height that has not been processed by the funnel. */
  nextBlockHeight: number = 0;

  // WebSocket connection for being notified of new blocks.
  wsClient: Client;
  iter: AsyncIterableIterator<ExecutionResult<{ blocks: CachedBlock }, unknown>>;
  wsBlocks: CachedBlock[];

  constructor(config: MidnightConfig) {
    this.caip2 = caip2PrefixFor(config);

    this.wsClient = createClient({
      url: config.indexerWS ?? defaultIndexerWs(config.indexer),
      webSocketImpl: WebSocket,
    });
    this.iter = this.wsClient.iterate<{ blocks: CachedBlock }>({
      query: `subscription { blocks { ${cachedBlockQuery} } }`,
    });
    this.wsBlocks = [];
  }

  async load(dbTx: PoolClient): Promise<MidnightFunnelCacheEntry> {
    const checkpoint = await getMidnightCheckpoint.run({ caip2: this.caip2 }, dbTx);
    if (checkpoint.length > 0) {
      this.nextBlockHeight = Number(checkpoint[0].block_height) + 1;
    }

    return this;
  }

  clear(): void {
    this.nextBlockHeight = 0;
  }
}

export async function wrapToMidnightFunnel(
  baseFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  chainInfo: ChainInfo<MidnightConfig>
): Promise<ChainFunnel> {
  try {
    // Connect to the cache.
    const cache = (sharedData.cacheManager.cacheEntries[MidnightFunnelCacheEntry.SYMBOL] ??=
      await new MidnightFunnelCacheEntry(chainInfo.config).load(dbTx));
    return new MidnightFunnel(sharedData, dbTx, chainInfo, baseFunnel, cache);
  } catch (err) {
    // Log then rethrow???
    doLog('[paima-funnel] Unable to initialize Midnight cde events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize Midnight cde events processor');
  }
}
