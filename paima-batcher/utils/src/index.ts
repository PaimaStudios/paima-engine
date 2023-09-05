import Web3 from 'web3';
import type { Contract } from 'web3-eth-contract';
import type { AbiItem } from 'web3-utils';
import HDWalletProvider from '@truffle/hdwallet-provider';
import type { TruffleEvmProvider } from '@paima/providers';
import { TruffleConnector } from '@paima/providers';

import { GenericRejectionCode } from './types.js';

import storageBuild from './artifacts/Storage.js';
import { AddressType } from '@paima/utils';

export * from './config.js';
export * from './config-validation.js';
export * from './types.js';
export * from './version.js';

export type { Web3 };

export let keepRunning: boolean;

export function requestStop(): void {
  keepRunning = false;
}

export function requestStart(): void {
  keepRunning = true;
}

export let gameInputValidatorClosed: boolean;
export let webserverClosed: boolean;

export function unsetGameInputValidatorClosed(): void {
  gameInputValidatorClosed = false;
}

export function setGameInputValidatorClosed(): void {
  gameInputValidatorClosed = true;
}

export function unsetWebserverClosed(): void {
  webserverClosed = false;
}

export function setWebserverClosed(): void {
  webserverClosed = true;
}

export const GENERIC_ERROR_MESSAGES = {
  [GenericRejectionCode.UNSUPPORTED_ADDRESS_TYPE]:
    'The user address is of an unknown or unsupported format',
  [GenericRejectionCode.INVALID_ADDRESS]: 'The user address is invalid',
  [GenericRejectionCode.INVALID_SIGNATURE]: 'The supplied signature is invalid',
  [GenericRejectionCode.ADDRESS_NOT_ALLOWED]: 'The user address is not allowed to submit inputs',
  [GenericRejectionCode.INVALID_GAME_INPUT]: 'The game input is invalid',
};

export const SUPPORTED_CHAIN_NAMES: string[] = [
  addressTypeName(AddressType.EVM),
  addressTypeName(AddressType.POLKADOT),
  addressTypeName(AddressType.CARDANO),
  addressTypeName(AddressType.ALGORAND),
];

const POLLING_INTERVAL = 10000;

export function addressTypeName(addressType: AddressType): string {
  switch (addressType) {
    case AddressType.EVM:
      return 'EVM';
    case AddressType.CARDANO:
      return 'Cardano';
    case AddressType.POLKADOT:
      return 'Astar / Polkadot';
    case AddressType.ALGORAND:
      return 'Algorand';
    default:
      return 'Unknown address type';
  }
}

export async function getAndConfirmWeb3(
  nodeUrl: string,
  privateKey: string,
  retryPeriodMs: number
): Promise<TruffleEvmProvider> {
  while (true) {
    try {
      const truffleProvider = await getWalletWeb3AndAddress(nodeUrl, privateKey);
      // just test the connection worked
      await truffleProvider.web3.eth.getBlockNumber();
      return truffleProvider;
    } catch (err) {
      console.log('Unable to reinitialize web3:', err);
      console.log(`Retrying in ${retryPeriodMs} ms...`);
      await wait(retryPeriodMs);
    }
  }
}

export async function getWalletWeb3AndAddress(
  nodeUrl: string,
  privateKey: string
): Promise<TruffleEvmProvider> {
  // retyping to any seems to be needed because initialize is private
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const origInit = (HDWalletProvider.prototype as any).initialize;
  // retyping to any seems to be needed because initialize is private
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HDWalletProvider.prototype as any).initialize = async function (): Promise<void> {
    while (true) {
      try {
        // eslint-disable-next-line @typescript-eslint/return-await
        return await origInit.call(this);
      } catch (e) {
        console.log('origInit failed');
        console.log(e);
      }
      await wait(1000);
    }
  };

  const wallet = new HDWalletProvider({
    privateKeys: [privateKey],
    providerOrUrl: nodeUrl,
    pollingInterval: POLLING_INTERVAL,
  });
  // retyping to any seems to be needed because initialize is private
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (wallet.engine as any)._blockTracker.on('error', (err: any) => {
    console.log('BlockTracker error', err);
  });
  // retyping to any seems to be needed because initialize is private
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (wallet.engine as any).on('error', (err: any) => {
    console.log('Web3ProviderEngine error', err);
  });

  return await TruffleConnector.instance().connectExternal(wallet);
}

export async function getWeb3(nodeUrl: string): Promise<Web3> {
  const web3 = new Web3(nodeUrl);
  try {
    await web3.eth.getNodeInfo();
  } catch (e) {
    throw new Error(`Error connecting to node at ${nodeUrl}:\n${e}`);
  }
  return web3;
}

export function getStorageContract(web3: Web3, address: string): Contract {
  return new web3.eth.Contract(storageBuild.abi as AbiItem[], address);
}

function hexStringToBytes(hexString: string): number[] {
  if (!/^[0-9a-fA-F]+$/.test(hexString)) {
    throw new Error('Non-hex digits found in hex string');
  }
  const bytes: number[] = [];
  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }
  for (let c = 0; c < hexString.length; c += 2) {
    const nextByte = hexString.slice(c, c + 2);
    bytes.push(parseInt(nextByte, 16));
  }
  return bytes;
}

export function hexStringToUint8Array(hexString: string): Uint8Array {
  return new Uint8Array(hexStringToBytes(hexString));
}

export const wait = async (ms: number): Promise<void> =>
  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });
