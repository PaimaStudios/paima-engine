export type NftInfo = {
  name: string,
  symbol: string,
  supply: number,
  owner: string,
  minter: string,
  baseUri: string,
};
export type NftSaleInfo = {
  price: number,
};
export type NativeNftSaleInfo = {
  decimals: number,
  owner:string,
};
export type Erc20NftSaleInfo = {
  currencies: Record<string, string>,
  owner: string,
};
export type GenericPaymentInfo = {
  owner: string;
}

export type NetworkContractDeployments = {
  Nft: NftInfo,
  NftSale: NftSaleInfo,
  NativeNftSale: NativeNftSaleInfo,
  Erc20NftSale: Erc20NftSaleInfo,
  GenericPayment: GenericPaymentInfo,
};

export type DeployConfigJson = {
  testnet: NetworkContractDeployments,
  mainnet: NetworkContractDeployments
}

export type NetworkContractAddresses = {
  Nft?: string,
  NftSale?: string,
  NativeNftSale?: string,
  Erc20NftSale?: string,
  GenericPayment?: string,
  GenericPaymentProxy?: string,
  NftDeploymentBlockHeight?: number // TODO: probably should get rid of this
};

export type ContractAddressJson = {
  testnet: NetworkContractAddresses,
  mainnet: NetworkContractAddresses
}

export type Options = {
  gasPrice: string,
  gasLimit: string,
};

export type MigrationFunction = (deployer: any, network: keyof DeployConfigJson, accounts: string[]) => Promise<void>;
