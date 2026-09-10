// The offer's content hash — the MIP-0006 `offerId` the node files it under.
//
// Defined by the node (packages/offer-guard: `offerHashFromBlob`) as the hex
// sha256 of the RAW MIP-0005 transaction bytes, not of the bech32m string, so
// the id is stable across display encodings and equals the hash of the DA blob
// itself. Reproducing it here lets a record that only stored the blob (written
// before `POST /v1/offers` echoed the id) join the same status reconciliation
// as every other record, instead of needing a separate batched-blob endpoint.

import { OfferFiles } from '@effectstream/mip-zswap-offer/mip5';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';

/** Null when the blob is not a decodable `swapoffer1…` string. */
export function deriveOfferId(blob: string): string | null {
  try {
    return bytesToHex(sha256(OfferFiles.decode(blob.trim())));
  } catch {
    return null;
  }
}
