import { retrieveFee, retryPromise, wait } from 'paima-sdk/paima-utils';
import { getStorageAddress, getWeb3, setFee } from '../state';
import { Result } from '../types';
import { buildDirectTx } from './data-processing';
import { sendWalletTransaction } from './wallet-metamask';

const TX_VERIFICATION_RETRY_DELAY = 1000;
const TX_VERIFICATION_DELAY = 1000;
const TX_VERIFICATION_RETRY_COUNT = 8;

type PostFxn = (tx: Record<string, any>) => Promise<string>;

export async function updateFee() {
  const web3 = await getWeb3();
  const newFee = await retrieveFee(getStorageAddress(), web3);
  setFee(newFee);
}

// On success returns the block number of the transaction.
export async function postConciselyEncodedData(
  userAddress: string,
  gameInput: string
): Promise<Result<number>> {
  return postString(sendWalletTransaction, userAddress, gameInput);
}

export async function postString(
  sendWalletTransaction: PostFxn,
  userAddress: string,
  dataUtf8: string
): Promise<Result<number>> {
  const tx = buildDirectTx(userAddress, dataUtf8);

  const txHash = await sendWalletTransaction(tx);
  return retryPromise(
    () => verifyTx(txHash, TX_VERIFICATION_DELAY),
    TX_VERIFICATION_RETRY_DELAY,
    TX_VERIFICATION_RETRY_COUNT
  );
}

// Verifies that the transaction took place and returns its block number on success
async function verifyTx(txHash: string, delay: number): Promise<Result<number>> {
  const [_, web3] = await Promise.all([wait(delay), getWeb3()]);
  const receipt = await web3.eth.getTransactionReceipt(txHash);
  return {
    success: true,
    result: receipt.blockNumber,
  };
}
