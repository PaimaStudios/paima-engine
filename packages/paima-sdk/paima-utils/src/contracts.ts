import Web3 from 'web3';
import type { AbiItem } from 'web3-utils';
import type { Contract, EventData } from 'web3-eth-contract';
import { isAddress } from 'web3-utils';

import type * as Contracts from './contract-types/index.js';

import { AddressType, ChainDataExtensionType, ChainDataExtensionDatumType } from './constants.js';
export type * from './contract-types/index.js';

// Export contract ABIs.
import paimaL2ContractBuild from './artifacts/PaimaL2Contract.js';
import erc20ContractBuild from './artifacts/ERC20Contract.js';
import erc165ContractBuild from './artifacts/ERC165Contract.js';
import erc721ContractBuild from './artifacts/ERC721Contract.js';
import paimaErc721ContractBuild from './artifacts/PaimaERC721Contract.js';
import erc1155ContractBuild from './artifacts/IERC1155Contract.js';
import erc6551RegistryContractBuild from './artifacts/ERC6551RegistryContract.js';
import oldErc6551RegistryContractBuild from './artifacts/OldERC6551RegistryContract.js';
export const contractAbis = {
  paimaL2ContractBuild,
  erc20ContractBuild,
  erc165ContractBuild,
  erc721ContractBuild,
  paimaErc721ContractBuild,
  erc1155ContractBuild,
  erc6551RegistryContractBuild,
  oldErc6551RegistryContractBuild,
};

// Re-export contract types.
export type { PaimaGameInteraction } from './contract-types/PaimaL2Contract.js';
export type { Transfer as ERC20Transfer } from './contract-types/ERC20Contract.js';
export type {
  Minted as PaimaMinted,
  Transfer as PaimaERC721Transfer,
} from './contract-types/PaimaERC721Contract.js';
export type { Transfer as ERC721Transfer } from './contract-types/ERC721Contract.js';
export type {
  TransferSingle as Erc1155TransferSingle,
  TransferBatch as Erc1155TransferBatch,
} from './contract-types/IERC1155Contract.js';
export type { AccountCreated } from './contract-types/ERC6551RegistryContract.js';

export type { Web3, Contract, AbiItem, EventData };
export { AddressType, ChainDataExtensionType, ChainDataExtensionDatumType };

export async function initWeb3(nodeUrl: string): Promise<Web3> {
  /**
   * enable the lines below if you want to debug RPC requests
   * However, not that JsonRpcEngine seems to have an issue in how it handles error
   * where promises that used to be caught by Paima Engine become uncaught exceptions
   * So best to only use this when debugging
   */
  // const engine = new JsonRpcEngine();
  // engine.push((req, _, next) => {
  //   console.dir(req, { depth: null });
  //   next();
  // });
  // engine.push(createFetchMiddleware({ btoa, fetch, rpcUrl: nodeUrl }));
  // const provider = providerFromEngine(engine);
  // // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  // const web3 = new Web3(provider as any);
  const web3 = new Web3(nodeUrl);
  try {
    await web3.eth.getNodeInfo();
  } catch (e) {
    throw new Error(`Error connecting to node at ${nodeUrl}:\n${e}`);
  }
  return web3;
}

export function getAbiContract(address: string, abi: AbiItem[], web3?: Web3): Contract {
  if (web3 === undefined) {
    web3 = new Web3();
  }
  return new web3.eth.Contract(abi, address);
}

export function getPaimaL2Contract(address: string, web3?: Web3): Contracts.PaimaL2Contract {
  return getAbiContract(
    address,
    paimaL2ContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.PaimaL2Contract;
}

export function getErc20Contract(address: string, web3?: Web3): Contracts.ERC20Contract {
  return getAbiContract(
    address,
    erc20ContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.ERC20Contract;
}

export function getErc721Contract(address: string, web3?: Web3): Contracts.ERC721Contract {
  return getAbiContract(
    address,
    erc721ContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.ERC721Contract;
}

export function getPaimaErc721Contract(
  address: string,
  web3?: Web3
): Contracts.PaimaERC721Contract {
  return getAbiContract(
    address,
    paimaErc721ContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.PaimaERC721Contract;
}

export function getErc1155Contract(address: string, web3?: Web3): Contracts.IERC1155Contract {
  return getAbiContract(
    address,
    erc1155ContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.IERC1155Contract;
}

export function getErc165Contract(address: string, web3?: Web3): Contracts.ERC165Contract {
  return getAbiContract(
    address,
    erc165ContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.ERC165Contract;
}

/** Default registry address specified in ERC6551 */
export const ERC6551_REGISTRY_DEFAULT = {
  // ERC6551 has an old version that got adopted by some projects that did not use indexed fields for the logs
  // You can find a version history here: https://github.com/erc6551/reference/releases
  Old: '0x02101dfB77FDE026414827Fdc604ddAF224F0921'.toLowerCase(),
  New: '0x000000006551c19487814612e58FE06813775758'.toLowerCase(),
};

export function getErc6551RegistryContract(
  address: string,
  web3?: Web3
): Contracts.ERC6551RegistryContract {
  return getAbiContract(
    address,
    erc6551RegistryContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.ERC6551RegistryContract;
}
export function getOldErc6551RegistryContract(
  address: string,
  web3?: Web3
): Contracts.OldERC6551RegistryContract {
  return getAbiContract(
    address,
    oldErc6551RegistryContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.OldERC6551RegistryContract;
}

export function validatePaimaL2ContractAddress(address: string): void {
  if (!isAddress(address)) {
    throw new Error(`Invalid storage address supplied. Found: ${address}`);
  }
}

export async function retrieveFee(address: string, web3: Web3): Promise<string> {
  const contract = getPaimaL2Contract(address, web3);
  return await contract.methods.fee().call();
}

export async function getPaimaL2ContractOwner(address: string, web3: Web3): Promise<string> {
  const contract = getPaimaL2Contract(address, web3);
  return await contract.methods.owner().call();
}
