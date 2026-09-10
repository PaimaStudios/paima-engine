import { describe, expect, test } from 'bun:test';
import { PREPROD_OFFER_BLOB, PREPROD_OFFER_ID } from './__fixtures__/preprodOfferDcdc4f4e';
import { deriveOfferId } from './offerId';

describe('deriveOfferId', () => {
  test('reproduces the id the preprod node filed a real offer under', () => {
    expect(deriveOfferId(PREPROD_OFFER_BLOB)).toBe(PREPROD_OFFER_ID);
  });

  test('is a function of the bytes, not the string', () => {
    expect(deriveOfferId(`  ${PREPROD_OFFER_BLOB}\n`)).toBe(PREPROD_OFFER_ID);
    expect(deriveOfferId(PREPROD_OFFER_BLOB.toUpperCase())).toBe(PREPROD_OFFER_ID);
  });

  test('null for anything that does not decode', () => {
    expect(deriveOfferId('')).toBeNull();
    expect(deriveOfferId('garbage')).toBeNull();
    expect(deriveOfferId('swapoffer1qqq')).toBeNull();
    // One corrupted character breaks the bech32m checksum.
    const bad = `${PREPROD_OFFER_BLOB.slice(0, 200)}x${PREPROD_OFFER_BLOB.slice(201)}`;
    expect(deriveOfferId(bad)).toBeNull();
  });
});
