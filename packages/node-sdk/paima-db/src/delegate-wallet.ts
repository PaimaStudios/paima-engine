import {
  getAddressFromAddress,
  getAddressFromId,
  getDelegationsTo,
} from './sql/wallet-delegation.queries.js';
import type { PoolClient } from 'pg';

export type WalletDelegate = { address: string; id: number };
export const NO_USER_ID = -1;

/**
 *  TODO
 *  This is a temporal fix as lru-cache module was
 *  not correctly packaged into a single file.
 */
export const addressCache = new Map<string, WalletDelegate>();

// Get Main Wallet and ID for address.
// If wallet does not exist, It will NOT be created in address, table.
export async function getMainAddress(address: string, DBConn: PoolClient): Promise<WalletDelegate> {
  let addressMapping: WalletDelegate | undefined = addressCache.get(address);
  if (addressMapping) return addressMapping;

  // get main address.
  // const addressResult = await this.getOrCreateNewAddress(address);
  const [addressResult] = await getAddressFromAddress.run({ address }, DBConn);
  if (!addressResult) {
    // This wallet has never been used before.
    // This value will get updated before sent to the STF.
    return { address, id: NO_USER_ID };
  }

  // if exists we have to check if it is a delegation.
  const [delegate] = await getDelegationsTo.run({ set_id: addressResult.id }, DBConn);
  if (!delegate) {
    // is main address or has no delegations.
    addressMapping = { address: addressResult.address, id: addressResult.id };
    addressCache.set(address, addressMapping);
    return addressMapping;
  }

  // if is delegation, get main address.
  const [mainAddress] = await getAddressFromId.run({ id: delegate.from_id }, DBConn);
  addressMapping = { address: mainAddress.address, id: mainAddress.id };
  addressCache.set(address, addressMapping);
  return addressMapping;
}
