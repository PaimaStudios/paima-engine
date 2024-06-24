import type { ApiPromise } from 'avail-js-sdk';
import type { Header as PolkadotHeader } from '@polkadot/types/interfaces/types';
import type { SubmittedData } from '@paima/sm';
import { base64Decode } from '@polkadot/util-crypto';
import { BaseFunnelSharedApi } from '../BaseFunnel.js';
import { createApi } from './createApi.js';

export const GET_DATA_TIMEOUT = 10000;

export type Header = PolkadotHeader;

export function getSlotFromHeader(header: Header, api: ApiPromise): number {
  const preRuntime = header.digest.logs.find(log => log.isPreRuntime)!.asPreRuntime;

  const rawBabeDigest = api.createType('RawBabePreDigest', preRuntime[1]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // FIXME: why is the conversion needed?
  const header = (await api.rpc.chain.getHeader(hash)) as unknown as Header;

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
    const header = (await api.rpc.chain.getHeader(hash)) as unknown as Header;

    const slot = getSlotFromHeader(header, api);

    results.push({
      number: header.number.toNumber(),
      hash: header.hash.toString(),
      slot: slot,
    });
  }

  return results;
}

export async function getDAData(
  api: ApiPromise,
  lc: string,
  from: number,
  to: number
): Promise<{ blockNumber: number; submittedData: SubmittedData[] }[]> {
  const data = [] as { blockNumber: number; submittedData: SubmittedData[] }[];

  for (let curr = from; curr <= to; curr++) {
    const responseRaw = await fetch(`${lc}/v2/blocks/${curr}/data?fields=data,extrinsic`);

    // TODO: handle better the status code ( not documented in the api though ).
    if (responseRaw.status !== 200) {
      continue;
    }

    const response = (await responseRaw.json()) as unknown as {
      block_number: number;
      data_transactions: { data: string; extrinsic: string }[];
    };

    if (response.data_transactions.length > 0) {
      // not sure how this would be controlled by extensions yet, so for now we
      // just generate a generic event, since the app_id is in the client, and the
      // data doesn't have a format.
      data.push({
        blockNumber: response.block_number,
        submittedData: response.data_transactions.map(d => {
          const dbytes = base64Decode(d.extrinsic);
          const decoded = api.createType('Extrinsic', dbytes);

          const data = base64Decode(d.data);
          const dstring = new TextDecoder().decode(data);

          return {
            realAddress: decoded.signer.toString(),
            inputData: dstring,
            inputNonce: '', // placeholder that will be filled later
            // There is no concept of supplying a fee to the app with the data
            // availability call, afaik.
            // We can get the fee with an extra rpc call to
            // `api.call.transactionPaymentApi.queryFeeDetails`, and we can get
            // the `tip` from the extrinsic itself, but these are just for the
            // block producer.
            suppliedValue: '0',
            scheduled: false,
          };
        }),
      });
    }
  }

  return data;
}

export async function getLatestAvailableBlockNumberFromLightClient(lc: string): Promise<number> {
  const responseRaw = await fetch(`${lc}/v2/status`);

  if (responseRaw.status !== 200) {
    throw new Error("Couldn't get light client status");
  }

  const response: { blocks: { available: { first: number; last: number } } } =
    await responseRaw.json();

  const last = response.blocks.available.last;

  return last;
}

export class AvailSharedApi extends BaseFunnelSharedApi {
  public constructor(private rpc: string) {
    super();
    this.getBlock.bind(this);
  }

  public override async getBlock(
    height: number
  ): Promise<{ timestamp: number | string } | undefined> {
    const api = await createApi(this.rpc);

    const headerData = await getMultipleHeaderData(api, [height]);

    const timestamp = slotToTimestamp(headerData[0].slot, api);

    return { timestamp: timestamp };
  }
}
