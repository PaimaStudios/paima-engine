import './config.js'; // place at the top to load ENV variables
import type { EthersEvmProvider } from '@paima/providers';
import { EthersConnector, WalletMode } from '@paima/providers';
import { paimaEndpoints } from '@paima/mw-core';
import { GenericRejectionCode } from './types.js';

import { AddressType, wait } from '@paima/utils';
import assertNever from 'assert-never';
import { ethers } from 'ethers';

export * from './config.js';
export * from './config-validation.js';
export * from './types.js';
export * from './version.js';

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
    case AddressType.UNKNOWN:
      return 'Unknown address type';
    default:
      assertNever(addressType, true);
      return 'Unknown address type';
  }
}

export async function getAndConfirmWeb3(
  nodeUrl: string,
  privateKey: string,
  retryPeriodMs: number
): Promise<EthersEvmProvider> {
  while (true) {
    try {
      const provider = await getWalletWeb3AndAddress(nodeUrl, privateKey);
      // just test the connection worked
      await provider.getConnection().api.provider!.getBlockNumber();
      return provider;
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
): Promise<EthersEvmProvider> {
  const wallet = new ethers.Wallet(privateKey);
  // Connect your wallet to the provider to enable network interactions
  const signer = wallet.connect(new ethers.JsonRpcProvider(nodeUrl));

  const connectedWallet = await paimaEndpoints.userWalletLogin({
    mode: WalletMode.EvmEthers,
    preferBatchedMode: false,
    connection: {
      api: signer,
      metadata: {
        name: 'paima-batcher',
        displayName: 'Paima Batcher',
      },
    },
  });
  if (!connectedWallet.success) {
    throw new Error(`Wallet connection failed`);
  }
  // we return this instead just to avoid having to port the whole batcher system to use the middleware
  const provider = EthersConnector.instance().getProvider();
  if (provider == null) {
    throw new Error(`Batcher failed to find Ethers provider`);
  }
  return provider;
}
