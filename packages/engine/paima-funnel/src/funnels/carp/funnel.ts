import {
  ChainDataExtensionType,
  DEFAULT_FUNNEL_TIMEOUT,
  ENV,
  Network,
  delay,
  doLog,
  logError,
  timeout,
} from '@paima/utils';
import type { ChainDataExtensionDatum } from '@paima/sm';
import {
  type ChainData,
  type ChainDataExtension,
  type ChainDataExtensionCardanoDelegation,
  type PresyncChainData,
} from '@paima/sm';
import { composeChainData, groupCdeData } from '../../utils.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import type { PoolClient } from 'pg';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import getCdePoolData from '../../cde/cardanoPool.js';
import { query } from '@dcspark/carp-client/client/src/index';
import { Routes } from '@dcspark/carp-client/shared/routes';

const confirmationDepth = '10';

function knownTime(): number {
  switch (ENV.CARDANO_NETWORK) {
    case 'preview':
      return 1666656000;
    case 'preprod':
      return 1666656000;
    case 'mainnet':
      return 1666656000;
    default:
      throw new Error('unknown cardano network');
  }
}

function timestampToAbsoluteSlot(timestamp: number): number {
  const firstSlot = 0;
  // map timestamps with a delta, since we are waiting for blocks.
  const confirmationTimeDelta = 20 * Number(confirmationDepth);

  return timestamp - confirmationTimeDelta - knownTime() + firstSlot;
}

export class CarpFunnel extends BaseFunnel implements ChainFunnel {
  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    private readonly baseFunnel: ChainFunnel,
    private readonly carpUrl: string,
    private readonly startSlot: number
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
      this.sharedData.extensions,
      lastTimestamp.timestamp as number
    );

    const composed = composeChainData(this.bufferedData, grouped);

    this.bufferedData = null;

    return composed;
  }

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [network: number]: PresyncChainData[] | 'finished' }> {
    const arg = args.find(arg => arg.network == Network.CARDANO);

    let data = await this.baseFunnel.readPresyncData(args);

    if (arg && arg.from >= 0 && arg.from < this.startSlot) {
      const poolEvents = await Promise.all(
        this.sharedData.extensions
          .filter(extension => extension.cdeType === ChainDataExtensionType.CardanoPool)
          .map(extension => {
            const data = getCdePoolData(
              this.carpUrl,
              extension as ChainDataExtensionCardanoDelegation,
              arg.from,
              Math.min(arg.to, this.startSlot - 1),
              slot => {
                return slot;
              }
            );
            return data;
          })
      );

      let grouped = groupCdeData(Network.CARDANO, arg.from, arg.to, poolEvents);

      if (grouped.length > 0) {
        data[Network.CARDANO] = grouped;
      }
    } else if (arg) {
      data[Network.CARDANO] = 'finished';
    }

    return data;
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    baseFunnel: ChainFunnel,
    carpUrl: string,
    startingBlockHeight: number
  ): Promise<CarpFunnel> {
    const startingSlot = timestampToAbsoluteSlot(
      (await sharedData.web3.eth.getBlock(startingBlockHeight)).timestamp as number
    );

    return new CarpFunnel(sharedData, dbTx, baseFunnel, carpUrl, startingSlot);
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

  while (true) {
    const stableBlock = await timeout(
      query(carpUrl, Routes.blockLatest, {
        offset: Number(confirmationDepth),
      }),
      DEFAULT_FUNNEL_TIMEOUT
    );

    if (stableBlock.block.slot > max) {
      break;
    }

    await delay(1000);
  }

  const blockNumbers = data.reduce(
    (dict, data) => {
      dict[timestampToAbsoluteSlot(data.timestamp)] = data.blockNumber;
      return dict;
    },
    {} as { [slot: number]: number }
  );

  // This extends blockNumbers but for intermediate slots.
  // Between two evm blocks there can be more than one slot, and the mapping only has the slots for blocks that exist.
  const mapSlotToBlockNumber = (slot: number) => {
    while (true) {
      const curr = blockNumbers[slot];
      if (curr) {
        return curr;
      }
      slot += 1;
    }
  };

  const poolEvents = await Promise.all(
    extensions.map((extension: ChainDataExtension): Promise<ChainDataExtensionDatum[]> => {
      if ('stopSlot' in extension && extension.stopSlot && min >= extension.stopSlot) {
        return Promise.resolve([]);
      }

      switch (extension.cdeType) {
        case ChainDataExtensionType.CardanoPool:
          const data = getCdePoolData(
            carpUrl,
            extension,
            min,
            Math.min(max, extension.stopSlot || max),
            mapSlotToBlockNumber
          );

          return data;
        default:
          return Promise.resolve([]);
      }
    })
  );

  let grouped = groupCdeData(
    Network.EVM,
    data[0].blockNumber,
    data[data.length - 1].blockNumber,
    poolEvents.filter(data => data.length > 0)
  );

  return grouped;
}

export async function wrapToCarpFunnel(
  chainFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  carpUrl: string | undefined,
  startingBlockHeight: number
): Promise<ChainFunnel> {
  if (!carpUrl) {
    return chainFunnel;
  }

  try {
    const ebp = await CarpFunnel.recoverState(
      sharedData,
      dbTx,
      chainFunnel,
      carpUrl,
      startingBlockHeight
    );
    return ebp;
  } catch (err) {
    doLog('[paima-funnel] Unable to initialize carp events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize carp events processor');
  }
}
