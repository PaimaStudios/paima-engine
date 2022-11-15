import { MetaMaskInpageProvider } from '@metamask/providers';
import Web3 from 'web3';

import { getTxTemplate } from 'paima-tx';
import type { TransactionTemplate } from 'paima-utils';

export interface Window {
  ethereum: MetaMaskInpageProvider;
}

export interface ContractData {
  fee: string;
  owner: string;
}

export const CHAIN_URI = 'https://rpc-devnet-cardano-evm.c1.milkomeda.com';
export const CONTRACT_ADDRESS = '0x852Ec3e5C0900C94206bCB4c09D9967238eBE122';
const CHAIN_ID = 200101;

const CONFIRMATION_WAIT_PERIOD = 4000;

export async function verifyWalletChain(): Promise<boolean> {
  try {
    return (window as any as Window).ethereum
      .request({ method: 'eth_chainId' })
      .then(res => parseInt(res as string) === CHAIN_ID);
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function userWalletLogin(): Promise<string> {
  let accounts;
  try {
    accounts = (await (window as any as Window).ethereum.request({
      method: 'eth_requestAccounts',
    })) as string[];
  } catch (e) {
    console.error(e);
  }
  if (!accounts) {
    throw new Error('Problem while retreiving accounts');
  } else {
    return accounts[0];
  }
}

export async function promiseSetFee(
  web3: Web3,
  userAddress: string,
  fee: string
): Promise<boolean> {
  const tx = {
    ...getTxTemplate(CONTRACT_ADDRESS, 'setFee', '0x' + BigInt(fee).toString(16)),
    from: userAddress,
  };
  console.log('tx:', tx);
  return promiseVerifiedTx(web3, tx);
}

export async function promiseSetOwner(
  web3: Web3,
  userAddress: string,
  owner: string
): Promise<boolean> {
  const tx = {
    ...getTxTemplate(CONTRACT_ADDRESS, 'setOwner', owner),
    from: userAddress,
  };
  console.log('tx:', tx);
  return promiseVerifiedTx(web3, tx);
}

export async function promiseWithdrawFunds(web3: Web3, userAddress: string): Promise<boolean> {
  const tx = {
    ...getTxTemplate(CONTRACT_ADDRESS, 'withdrawFunds'),
    from: userAddress,
  };
  console.log('tx:', tx);
  return promiseVerifiedTx(web3, tx);
}

export const promiseVerifiedTx = (web3: Web3, tx: TransactionTemplate) => {
  return (window as any as Window).ethereum
    .request({
      method: 'eth_sendTransaction',
      params: [tx],
    })
    .then(hash => verifyTx(web3, hash as string));
};

export const verifyTx = (web3: Web3, hash: string): Promise<boolean> => {
  return new Promise(res => {
    setTimeout(() => {
      web3.eth.getTransactionReceipt(hash).then(receipt => res(receipt.status));
    }, CONFIRMATION_WAIT_PERIOD);
  });
};
