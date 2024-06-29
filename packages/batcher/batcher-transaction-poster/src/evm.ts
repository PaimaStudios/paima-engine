import type { Pool } from 'pg';
import { ENV } from '@paima/batcher-utils';
import type { EthersEvmProvider } from '@paima/providers';
import { estimateGasLimit } from './gas-limit.js';
import { contractAbis } from '@paima/utils';
import { utf8ToHex } from 'web3-utils';
import { ethers } from 'ethers';
import BatchedTransactionPosterBase from './transactionPoster.js';

class EvmBatchedTransactionPoster extends BatchedTransactionPosterBase {
  private provider: EthersEvmProvider;
  private contractAddress: string;
  private fee: string;
  private storage: ethers.Contract;

  constructor(provider: EthersEvmProvider, contractAddress: string, maxSize: number, pool: Pool) {
    super(maxSize, pool);
    this.provider = provider;
    this.contractAddress = contractAddress;
    this.fee = ENV.DEFAULT_FEE;
    // TODO: this isn't a typed version of the contract
    //       since paima-utils still uses web3 and we haven't migrated to something like viem
    this.storage = new ethers.Contract(
      contractAddress,
      contractAbis.paimaL2ContractBuild.abi,
      provider.getConnection().api
    );
  }

  public override initialize = async (): Promise<void> => {
    try {
      this.fee = await this.storage.fee();
    } catch (err) {
      console.log(
        '[batcher-transaction-poster] Error while retrieving fee, reverting to default:',
        err
      );
      this.fee = ENV.DEFAULT_FEE;
    }
  };

  public override updateProvider = (newProvider: EthersEvmProvider): void => {
    this.provider = newProvider;
  };

  protected override postMessage = async (msg: string): Promise<[number, string]> => {
    const hexMsg = utf8ToHex(msg);
    // todo: unify with buildDirectTx
    const iface = new ethers.Interface([
      'function paimaSubmitGameInput(bytes calldata data) payable',
    ]);
    const encodedData = iface.encodeFunctionData('paimaSubmitGameInput', [hexMsg]);
    const transaction = await this.provider.sendTransaction({
      data: encodedData,
      to: this.contractAddress,
      from: this.provider.getAddress().address,
      value: '0x' + Number(this.fee).toString(16),
      gasLimit: estimateGasLimit(msg.length),
    });
    const receipt = (await transaction.extra.wait())!;
    return [receipt.blockNumber, receipt.hash];
  };
}

export default EvmBatchedTransactionPoster;
