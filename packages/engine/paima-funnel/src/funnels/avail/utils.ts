import type { ApiPromise } from 'avail-js-sdk';
import type { Header } from '@polkadot/types/interfaces/types';

export function getSlotFromHeader(header: Header, api: ApiPromise): number {
  const preRuntime = header.digest.logs.find(log => log.isPreRuntime)!.asPreRuntime;

  const rawBabeDigest = api.createType('RawBabePreDigest', preRuntime[1]);

  const babeDigest = rawBabeDigest.toPrimitive() as unknown as any;

  // the object is an enumeration, but all the variants have a slotNumber field
  const slot = babeDigest[Object.getOwnPropertyNames(babeDigest)[0]].slotNumber;
  return slot;
}

export async function getLatestBlockNumber(api: ApiPromise): Promise<number> {
  let highHash = await api.rpc.chain.getFinalizedHead();
  let high = (await api.rpc.chain.getHeader(highHash)).number.toNumber();
  return high;
}

export async function getTimestampForBlockAt(api: ApiPromise, mid: number): Promise<number> {
  const hash = await api.rpc.chain.getBlockHash(mid);
  const header = await api.rpc.chain.getHeader(hash);

  const slot = getSlotFromHeader(header, api);
  return slotToTimestamp(slot, api);
}

export function slotToTimestamp(slot: number, api: ApiPromise): number {
  // this is how it's computed by the pallet
  // https://paritytech.github.io/polkadot-sdk/master/src/pallet_babe/lib.rs.html#533
  const slotDuration = (Number.parseInt(api.consts.timestamp.minimumPeriod.toString()) * 2) / 1000;

  // slots start at unix epoch:
  // https://paritytech.github.io/polkadot-sdk/master/src/pallet_babe/lib.rs.html#902
  return slot * slotDuration;
}

// inverse to `slotToTimestamp`
export function timestampToSlot(timestamp: number, api: ApiPromise): number {
  const slotDuration = (Number.parseInt(api.consts.timestamp.minimumPeriod.toString()) * 2) / 1000;

  // slots start at the unix epoch regardless of the genesis timestamp
  return timestamp / slotDuration;
}

type HeaderData = { number: number; hash: string; slot: number };

export async function getMultipleHeaderData(
  api: ApiPromise,
  blockNumbers: number[]
): Promise<HeaderData[]> {
  const results = [] as HeaderData[];

  for (const bn of blockNumbers) {
    // NOTE: the light client allows getting header directly from block number,
    // but it doesn't provide the babe data for the slot
    const hash = await api.rpc.chain.getBlockHash(bn);
    const header = await api.rpc.chain.getHeader(hash);

    const slot = getSlotFromHeader(header, api);

    results.push({
      number: header.number.toNumber(),
      hash: header.hash.toString(),
      slot: slot,
    });
  }

  return results;
}
