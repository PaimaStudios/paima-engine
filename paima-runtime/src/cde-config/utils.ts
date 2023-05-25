import { ChainDataExtensionType } from '@paima/utils';

import type { ChainDataExtension } from '../types';

const CDE_TYPE_MAP: Record<string, ChainDataExtensionType> = {
  erc20: ChainDataExtensionType.ERC20,
  erc721: ChainDataExtensionType.ERC721,
  'erc20-deposit': ChainDataExtensionType.ERC20Deposit,
};

export function parseCdeType(typeString: string): ChainDataExtensionType {
  if (CDE_TYPE_MAP[typeString]) {
    return CDE_TYPE_MAP[typeString];
  } else {
    return ChainDataExtensionType.UNKNOWN;
  }
}

export function getEarliestStartBlockheight(config: ChainDataExtension[]): number {
  const startBlockheights = config.map(cde => cde.startBlockHeight).filter(sbh => !!sbh);
  const minStartBlockheight = Math.min(...startBlockheights);
  return isFinite(minStartBlockheight) ? minStartBlockheight : -1;
}
