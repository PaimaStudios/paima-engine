import type { Pool } from 'pg';

import { ChainDataExtensionType } from '@paima/utils';
import { getSpecificChainDataExtension } from '@paima/db';

import {
  getCdeIdByAddress,
  getCdeIdByTypeAndAddress,
  getNftOwner,
  getOwnedNfts,
  getTokenBalance,
} from './cde-access';

export class CdeAccessObject {
  protected readonlyDBConn: Pool;
  protected cdeId: number;
  protected cdeType: ChainDataExtensionType;

  constructor(readonlyDBConn: Pool, cdeId: number, cdeType: ChainDataExtensionType) {
    this.readonlyDBConn = readonlyDBConn;
    this.cdeId = cdeId;
    this.cdeType = cdeType;
  }

  static fromCdeIdAndType = async (
    readonlyDBConn: Pool,
    cdeId: number,
    cdeType: ChainDataExtensionType
  ): Promise<CdeAccessObject | null> => {
    switch (cdeType) {
      case ChainDataExtensionType.ERC20:
        return new Erc20AccessObject(readonlyDBConn, cdeId);
      case ChainDataExtensionType.ERC721:
        return new Erc721AccessObject(readonlyDBConn, cdeId);
      default:
        return null;
    }
  };

  static fromCdeId = async (
    readonlyDBConn: Pool,
    cdeId: number
  ): Promise<CdeAccessObject | null> => {
    const cdeConfigs = await getSpecificChainDataExtension.run({ cde_id: cdeId }, readonlyDBConn);
    if (cdeConfigs.length !== 1) {
      return null;
    }
    const cdeConfig = cdeConfigs[0];
    return await this.fromCdeIdAndType(readonlyDBConn, cdeId, cdeConfig.cde_type);
  };

  static fromContractAddress = async (
    readonlyDBConn: Pool,
    contractAddress: string
  ): Promise<CdeAccessObject | null> => {
    const cdeIds = await getCdeIdByAddress(readonlyDBConn, contractAddress);
    if (cdeIds.length !== 1) {
      return null;
    }
    const cdeId = cdeIds[0];
    return await this.fromCdeId(readonlyDBConn, cdeId);
  };

  static fromTypeAndContractAddress = async (
    readonlyDBConn: Pool,
    cdeType: ChainDataExtensionType,
    contractAddress: string
  ): Promise<CdeAccessObject | null> => {
    const cdeIds = await getCdeIdByTypeAndAddress(readonlyDBConn, cdeType, contractAddress);
    if (cdeIds.length !== 1) {
      return null;
    }
    const cdeId = cdeIds[0];
    return await this.fromCdeIdAndType(readonlyDBConn, cdeId, cdeType);
  };
}

export class Erc20AccessObject extends CdeAccessObject {
  constructor(readonlyDBConn: Pool, cdeId: number) {
    super(readonlyDBConn, cdeId, ChainDataExtensionType.ERC20);
  }

  public getTokenBalance = async (walletAddress: string): Promise<string | null> => {
    return await getTokenBalance(this.readonlyDBConn, this.cdeId, walletAddress);
  };
}

export class Erc721AccessObject extends CdeAccessObject {
  constructor(readonlyDBConn: Pool, cdeId: number) {
    super(readonlyDBConn, cdeId, ChainDataExtensionType.ERC721);
  }

  public getNftOwner = async (tokenId: string): Promise<string | null> => {
    return await getNftOwner(this.readonlyDBConn, this.cdeId, tokenId);
  };

  public getOwnedNfts = async (ownerAddress: string): Promise<string[]> => {
    return await getOwnedNfts(this.readonlyDBConn, this.cdeId, ownerAddress);
  };
}
