import type { Pool } from 'pg';
import { base64Encode } from '@polkadot/util-crypto';
import BatchedTransactionPosterBase from './transactionPoster.js';

class AvailBatchedTransactionPoster extends BatchedTransactionPosterBase {
  private provider: string;

  constructor(provider: string, maxSize: number, pool: Pool) {
    super(maxSize, pool);
    this.provider = provider;
  }

  protected override postMessage = async (msg: string): Promise<[number, string]> => {
    console.log('msg', msg);
    const bytesMsg = new TextEncoder().encode(msg);
    const data = base64Encode(bytesMsg);

    console.log('data', data);

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

    console.log('receipt', receipt);

    return [receipt.block_number, receipt.hash];
  };
}

export default AvailBatchedTransactionPoster;
