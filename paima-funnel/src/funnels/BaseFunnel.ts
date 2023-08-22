import type { ChainData, ChainDataExtension, ChainFunnel, PresyncChainData } from '@paima/runtime';
import { groupCdeData } from '../utils';
import { ENV, doLog } from '@paima/utils';
import type { PaimaL2Contract, Web3 } from '@paima/utils';
import { getUngroupedCdeData } from '../cde/reading';

export type FunnelSharedData = {
  readonly web3: Web3;
  readonly paimaL2Contract: PaimaL2Contract;
  readonly extensions: ChainDataExtension[];
  readonly extensionsValid: boolean;
  /** latest block according to the remote RPC */
  latestAvailableBlockNumber: number;
};

/**
 * Base funnel that implements the bare-bones required functionality of the Paima Funnel
 */
export class BaseFunnel implements ChainFunnel {
  constructor(protected sharedData: FunnelSharedData) {}

  public getExtensions = (): ChainDataExtension[] => {
    return this.sharedData.extensions;
  };

  public extensionsAreValid = (): boolean => {
    return this.sharedData.extensionsValid;
  };

  public readData = async (_blockHeight: number): Promise<ChainData[]> => {
    return [];
  };

  public readPresyncData = async (
    fromBlock: number,
    toBlock: number
  ): Promise<PresyncChainData[]> => {
    try {
      toBlock = Math.min(toBlock, ENV.START_BLOCKHEIGHT);
      fromBlock = Math.max(fromBlock, 0);
      if (fromBlock > toBlock) {
        return [];
      }

      const ungroupedCdeData = await getUngroupedCdeData(
        this.sharedData.web3,
        this.sharedData.extensions,
        fromBlock,
        toBlock
      );
      return groupCdeData(fromBlock, toBlock, ungroupedCdeData);
    } catch (err) {
      doLog(`[paima-funnel::readPresyncData] Exception occurred while reading blocks: ${err}`);
      return [];
    }
  };

  public recoverState = async (): Promise<void> => {};
}