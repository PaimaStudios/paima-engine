import type { Pool } from 'pg';
import { base64Encode } from '@polkadot/util-crypto';
import BatchedTransactionPosterBase from './transactionPoster.js';
import { BatcherStatus } from '@paima/events';
import { AvailConnector } from '@paima/providers';

class AvailBatchedTransactionPoster extends BatchedTransactionPosterBase {
  private _provider: string;

  constructor(provider: string, maxSize: number, pool: Pool) {
    super(maxSize, pool);
    this._provider = provider;
  }

  public override postMessage = async (
    msg: string,
    hashes: string[]
  ): Promise<[number, string]> => {
    const bytesMsg = new TextEncoder().encode(msg);
    const data = base64Encode(bytesMsg);

    const rpcProvider = AvailConnector.instance().getProvider();
    if (rpcProvider == null) {
      throw new Error(`Batcher failed to find Avail JS provider`);
    }
    const tx = rpcProvider.getConnection().api.rpc.tx.dataAvailability.submitData(data);
    const signer = rpcProvider.getConnection().api.keyring.getPairs()[0];

    let sentPosted = false;
    const result = await new Promise<[number, string]>((resolve, reject): void => {
      void tx
        .signAndSend(signer, { nonce: -1 }, async result => {
          if (result.isError) {
            reject(result);
          }
          if (!sentPosted) {
            sentPosted = true;
            await Promise.all(
              this.updateMqttStatus(hashes, undefined, result.txHash.toHex(), BatcherStatus.Posting)
            );
          }
          if (result.isInBlock) {
            const signedBlock = await rpcProvider
              .getConnection()
              .api.rpc.derive.chain.getBlock(result.status.asInBlock.toHex());
            await Promise.all(
              this.updateMqttStatus(
                hashes,
                signedBlock.block.header.number.toNumber(),
                result.txHash.toHex(),
                BatcherStatus.Finalizing
              )
            );
          }
          if (result.isFinalized) {
            const signedBlock = await rpcProvider
              .getConnection()
              .api.rpc.derive.chain.getBlock(result.status.asFinalized.toHex());
            resolve([signedBlock.block.header.number.toNumber(), result.txHash.toHex()]);
          }
        })
        .catch(reject);
    });
    return result;
  };
}

export default AvailBatchedTransactionPoster;
