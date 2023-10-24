import {
  ChainDataExtensionType,
  DEFAULT_FUNNEL_TIMEOUT,
  doLog,
  logError,
  timeout,
} from '@paima/utils';
import {
  type ChainData,
  type ChainDataExtension,
  type ChainDataExtensionCardanoDelegation,
  type PresyncChainData,
} from '@paima/sm';
import { composeChainData, groupCdeData } from '../../utils';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import type { PoolClient } from 'pg';
import getCdePoolData from '../../cde/cardanoPool.js';
import axios from 'axios';
import type { ChainFunnel } from '@paima/runtime';

type BlockInfo = {
  block: {
    era: number;
    hash: string;
    height: number;
    epoch: number;
    slot: number;
  };
};

// hardcoded preview time
const knownTime = 1666656000;

const confirmationDepth = '10';

function timestampToAbsoluteSlot(timestamp: number): number {
  const firstSlot = 0;
  // map timestamps with a delta, since we are waiting for blocks.
  const confirmationTimeDelta = 20 * 10;

  return timestamp - confirmationTimeDelta - knownTime + firstSlot;
}

export class CarpFunnel extends BaseFunnel implements ChainFunnel {
  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    private readonly baseFunnel: ChainFunnel,
    private readonly carpUrl: string
  ) {
    super(sharedData, dbTx);
    // TODO: replace once TS5 decorators are better supported
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.bufferedData = null;
  }

  private bufferedData: ChainData[] | null;

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    if (!this.bufferedData || this.bufferedData[0].blockNumber != blockHeight) {
      const data = await this.baseFunnel.readData(blockHeight);

      if (data.length === 0) {
        return data;
      }

      this.bufferedData = data;
    }

    // there are most likely some slots between the last end of range and the
    // first block in the current range, so we need to start from the previous point.

    // TODO: cache this? but it's not in the db afaik, so it can't be done on
    // recoverState
    const lastTimestamp = await timeout(
      this.sharedData.web3.eth.getBlock(blockHeight - 1),
      DEFAULT_FUNNEL_TIMEOUT
    );

    let grouped = await readDataInternal(
      this.bufferedData,
      this.carpUrl,
      this.sharedData.extensions.filter(ext => ext.cdeType == ChainDataExtensionType.CardanoPool),
      lastTimestamp.timestamp as number
    );

    const composed = composeChainData(this.bufferedData, grouped);

    this.bufferedData = null;

    return composed;
  }

  public override async readPresyncData(
    fromBlock: number,
    toBlock: number
  ): Promise<PresyncChainData[]> {
    return await this.baseFunnel.readPresyncData(fromBlock, toBlock);
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    baseFunnel: ChainFunnel,
    carpUrl: string
  ): Promise<CarpFunnel> {
    return new CarpFunnel(sharedData, dbTx, baseFunnel, carpUrl);
  }
}

async function readDataInternal(
  data: ChainData[],
  carpUrl: string,
  extensions: ChainDataExtension[],
  lastTimestamp: number
): Promise<PresyncChainData[]> {
  // the lower range is exclusive
  const min = timestampToAbsoluteSlot(lastTimestamp);
  // the upper range is inclusive
  const max = timestampToAbsoluteSlot(Math.max(...data.map(data => data.timestamp)));

  const sleep = (ms: number): Promise<number> => new Promise(resolve => setTimeout(resolve, ms));

  while (true) {
    // TODO: replace with carp client
    const stableBlock = await timeout(
      axios.post<BlockInfo>(`${carpUrl}/block/latest`, {
        offset: confirmationDepth,
      }),
      DEFAULT_FUNNEL_TIMEOUT
    );

    if (stableBlock.data.block.slot > max) {
      break;
    }

    // TODO: is there a more js-like way of doing this?
    await sleep(1000);
  }

  const blockNumbers = data.reduce(
    (dict, data) => {
      dict[timestampToAbsoluteSlot(data.timestamp)] = data.blockNumber;
      return dict;
    },
    {} as { [slot: number]: number }
  );

  const poolEvents = await Promise.all(
    extensions
      .filter(extension => extension.cdeType === ChainDataExtensionType.CardanoPool)
      .map(extension => {
        const data = getCdePoolData(
          `${carpUrl}/delegation/pool`,
          extension as ChainDataExtensionCardanoDelegation,
          min,
          max,
          slot => {
            while (true) {
              const curr = blockNumbers[slot];
              if (curr) {
                return curr;
              }
              slot += 1;
            }
          }
        );
        return data;
      })
  );

  let grouped = groupCdeData(data[0].blockNumber, data[data.length - 1].blockNumber, poolEvents);

  return grouped;
}

export async function wrapToCarpFunnel(
  chainFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  carpUrl: string | undefined
): Promise<ChainFunnel> {
  if (!carpUrl) {
    return chainFunnel;
  }

  try {
    const ebp = await CarpFunnel.recoverState(sharedData, dbTx, chainFunnel, carpUrl);
    return ebp;
  } catch (err) {
    doLog('[paima-funnel] Unable to initialize carp events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize carp events processor');
  }
}
