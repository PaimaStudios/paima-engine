import type { Pool } from 'pg';
import { base64Encode } from '@polkadot/util-crypto';
import BatchedTransactionPosterBase from './transactionPoster.js';
import { BatcherStatus } from '@paima/events';
import { AvailConnector } from '@paima/providers';
import type { ISubmittableResult } from '@polkadot/types/types';

class AvailBatchedTransactionPoster extends BatchedTransactionPosterBase {
  private provider: string;

  constructor(provider: string, maxSize: number, pool: Pool) {
    super(maxSize, pool);
    this.provider = provider;
  }

  public override postMessage = async (
    msg: string,
    hashes: string[]
  ): Promise<[number, string]> => {
    const bytesMsg = new TextEncoder().encode(msg);
    const data = base64Encode(bytesMsg);

    const provider = AvailConnector.instance().getProvider();
    if (provider == null) {
      throw new Error(`Batcher failed to find Avail JS provider`);
    }
    const tx = provider.getConnection().api.rpc.tx.dataAvailability.submitData(data);

    let sentPosted = false;
    const result = await new Promise<[number, string]>((res, rej) =>
      tx.signAndSend(provider.getAddress().address, { nonce: -1 }, async result => {
        if (result.isError) {
          rej(result);
        }
        if (!sentPosted) {
          sentPosted = true;
          await this.updateMqttStatus(
            hashes,
            undefined,
            result.txHash.toHex(),
            BatcherStatus.Posting
          );
        }
        if (result.isInBlock) {
          const signedBlock = await provider
            .getConnection()
            .api.rpc.derive.chain.getBlock(result.status.asInBlock.toHex());
          await this.updateMqttStatus(
            hashes,
            signedBlock.block.header.number.toNumber(),
            result.txHash.toHex(),
            BatcherStatus.Finalizing
          );
        }
        if (result.isFinalized) {
          const signedBlock = await provider
            .getConnection()
            .api.rpc.derive.chain.getBlock(result.status.asInBlock.toHex());
          res([signedBlock.block.header.number.toNumber(), result.txHash.toHex()]);
        }
      })
    );
    return result;
  };
}

export default AvailBatchedTransactionPoster;
