import * as Cardano from '@dcspark/cardano-multiplatform-lib-nodejs';
import * as MessageSign from '@emurgo/cardano-message-signing-nodejs';

import { doLog } from '@paima/utils';

export default async function (
  userAddress: string,
  message: string,
  signedMessage: string
): Promise<boolean> {
  try {
    const msg = MessageSign.COSESign1.from_bytes(Buffer.from(signedMessage, 'hex'));
    const headermap = msg.headers().protected().deserialized_headers();

    const pk = Cardano.PublicKey.from_bytes(headermap.key_id() ?? new Uint8Array(0));
    const data = msg.signed_data().to_bytes();
    const sig = Cardano.Ed25519Signature.from_bytes(msg.signature());

    const addrHex = Buffer.from(
      Cardano.Address.from_bytes(
        headermap.header(MessageSign.Label.new_text('address'))?.as_bytes() ?? new Uint8Array(0)
      ).to_bytes()
    ).toString('hex');
    const payload = new TextDecoder('utf-8').decode(msg.payload());

    const result = pk.verify(data, sig) && addrHex === userAddress && payload === message;
    return result;
  } catch (err) {
    doLog(`[funnel] error verifying cardano signature: ${err}`);
    return false;
  }
}
