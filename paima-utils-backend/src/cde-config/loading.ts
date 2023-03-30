import type { ChainDataExtension } from '@paima/utils';
import { ChainDataExtensionType } from '@paima/utils';

const HARDCODED_CDE_DJED_SC: ChainDataExtension = {
  cdeId: 1,
  cdeType: ChainDataExtensionType.ERC20,
  contractAddress: '0x69cD594C6dC452A098dCebac0eF57f445247a022',
  startBlockHeight: 4502749,
  initializationPrefix: '',
};

const HARDCODED_CDE_DJED_RC: ChainDataExtension = {
  cdeId: 2,
  cdeType: ChainDataExtensionType.ERC20,
  contractAddress: '0x35963af2fA1E6cBf984369B69eCf24c0F1B671B2',
  startBlockHeight: 4502749,
  initializationPrefix: '',
};

export async function loadChainDataExtensions(): Promise<ChainDataExtension[]> {
  return [HARDCODED_CDE_DJED_SC, HARDCODED_CDE_DJED_RC];
}
