export type NetworkContractAddresses = {
  PaimaL2Contract?: string,
};

export type ContractAddressJson = {
  testnet: NetworkContractAddresses,
  mainnet: NetworkContractAddresses
}

export type Options = {
  gasPrice: string,
  gasLimit: string,
};

export type MigrationFunction = (deployer: any, network: keyof ContractAddressJson) => Promise<void>;

