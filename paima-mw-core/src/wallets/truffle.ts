import Web3 from 'web3';
import HDWalletProvider from '@truffle/hdwallet-provider';
import {
  getChainUri,
  getTruffleAddress,
  getTruffleWeb3,
  setTruffleAddress,
  setTruffleProvider,
  setTruffleWeb3,
} from '../state';

const DEFAULT_GAS_LIMIT = 100000;

export async function connectWallet(privateKey: string): Promise<boolean> {
  const wallet = new HDWalletProvider({
    privateKeys: [privateKey],
    providerOrUrl: getChainUri(),
  });
  // The line below should work without the <any> addition, and does in other projects (with the same versions of imported packages),
  // but for some reason causes typing issues here.
  const web3 = new Web3(<any>wallet);
  const address = wallet.getAddress();

  setTruffleProvider(wallet);
  setTruffleAddress(address);
  setTruffleWeb3(web3);
  return true;
}

export async function sendWalletTransaction(tx: Record<string, any>): Promise<string> {
  const web3 = getTruffleWeb3();
  const address = getTruffleAddress();
  const nonce = await web3?.eth.getTransactionCount(address);
  const finalTx = {
    ...tx,
    nonce,
    gasLimit: DEFAULT_GAS_LIMIT,
  };

  const result = await web3?.eth.sendTransaction(finalTx);
  return result?.transactionHash || '';
}

export type { HDWalletProvider };
