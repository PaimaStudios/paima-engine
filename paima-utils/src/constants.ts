export const enum AddressType {
  UNKNOWN = 0,
  EVM = 1,
  CARDANO = 2,
  POLKADOT = 3,
}

export const OUTER_BATCH_DIVIDER: string = '\x02';
export const INNER_BATCH_DIVIDER: string = '\x03';

export const DEFAULT_FUNNEL_TIMEOUT = 5000;

export const enum ChainDataExtensionType {
  UNKNOWN = 0,
  ERC20 = 1,
  ERC721 = 2,
  PaimaERC721 = 3,
  ERC20Deposit = 4,
}

export const enum ChainDataExtensionDatumType {
  ERC20Transfer,
  ERC20Deposit,
  ERC721Mint,
  ERC721Transfer,
}
