import type { Pool } from 'pg';
import { base64Encode } from '@polkadot/util-crypto';
import BatchedTransactionPosterBase from './transactionPoster.js';

class AvailBatchedTransactionPoster extends BatchedTransactionPosterBase {
  private provider: string;

  constructor(provider: string, maxSize: number, pool: Pool) {
    super(maxSize, pool);
    this.provider = provider;
  }

  public override postMessage = async (msg: string): Promise<[number, string]> => {
    const bytesMsg = new TextEncoder().encode(msg);
    const data = base64Encode(bytesMsg);

    const req = fetch(`${this.provider}/v2/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: data,
      }),
    })
      .then(response => response.json())
      .catch(error => console.error(error));

    const receipt = await req;

    return [receipt.block_number, receipt.hash];
  };
}

export default AvailBatchedTransactionPoster;
