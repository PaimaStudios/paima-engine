import type { ApiPromise } from 'avail-js-sdk';
import type { Header as PolkadotHeader, DigestItem } from '@polkadot/types/interfaces/types';
import { Bytes } from '@polkadot/types-codec';
import type { SubmittedData } from '@paima/sm';
import { base64Decode } from '@polkadot/util-crypto';
import { BaseFunnelSharedApi } from '../BaseFunnel.js';
import { createApi } from './createApi.js';
import { GenericConsensusEngineId } from '@polkadot/types/generic/ConsensusEngineId';

export const GET_DATA_TIMEOUT = 10000;

export type Header = PolkadotHeader;

export async function getTimestampForBlockAt(
  lc: string,
  api: ApiPromise,
  bn: number
): Promise<number> {
  const header = await getBlockHeaderDataFromLightClient(lc, bn, api);

  return slotToTimestamp(header.slot, api);
}

export function slotToTimestamp(slot: number, api: ApiPromise): number {
  // this is how it's computed by the pallet
  // https://github.com/paritytech/polkadot-sdk/blob/7ecf3f757a5d6f622309cea7f788e8a547a5dce8/substrate/frame/babe/src/lib.rs#L566
  const slotDuration = (Number.parseInt(api.consts.timestamp.minimumPeriod.toString()) * 2) / 1000;

  // slots start at unix epoch:
  // https://github.com/paritytech/polkadot-sdk/blob/7ecf3f757a5d6f622309cea7f788e8a547a5dce8/substrate/frame/babe/src/lib.rs#L935
  return slot * slotDuration;
}

// inverse to `slotToTimestamp`
export function timestampToSlot(timestamp: number, api: ApiPromise): number {
  const slotDuration = (Number.parseInt(api.consts.timestamp.minimumPeriod.toString()) * 2) / 1000;

  // slots start at the unix epoch regardless of the genesis timestamp
  return timestamp / slotDuration;
}

export type HeaderData = { number: number; hash: string; slot: number };

export async function getMultipleHeaderData(
  api: ApiPromise,
  lc: string,
  blockNumbers: number[]
): Promise<HeaderData[]> {
  const results = [] as HeaderData[];

  for (const bn of blockNumbers) {
    results.push(await getBlockHeaderDataFromLightClient(lc, bn, api));
  }

  return results;
}

export async function getBlockHeaderDataFromLightClient(
  lc: string,
  bn: number,
  api: ApiPromise
): Promise<{ number: number; hash: string; slot: number }> {
  const responseRaw = await fetch(`${lc}/v2/blocks/${bn}/header`);

  if (responseRaw.status !== 200) {
    // we don't want to accidentally skip blocks if there is something wrong
    // with the light client. We only fetch blocks in range, so a not found
    // here it's a logic error.
    throw new Error(
      `Unexpected error encountered when fetching headers from Avail's light client. Error: ${responseRaw.status}`
    );
  }

  const response = (await responseRaw.json()) as unknown as {
    hash: string;
    number: number;
    digest: {
      logs: {
        [key in DigestItem['type']]: [number[], number[]];
      }[];
    };
  };

  const preRuntimeJson = response.digest.logs.find(log => log.PreRuntime)?.PreRuntime;

  if (!preRuntimeJson) {
    throw new Error("Couldn't find preruntime digest");
  }

  // using ts-expect-error because for some reason the types of the registry are
  // different, but avail-js-sdk doesn't seem to re-export @polkadot/types in
  // order to access these constructors directly.
  const preRuntime = [
    // this is not used, but we parse it just in case it fails.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    new GenericConsensusEngineId(api.registry, preRuntimeJson[0]),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    new Bytes(api.registry, preRuntimeJson[1]),
  ];

  const rawBabeDigest = api.createType('RawBabePreDigest', preRuntime[1]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const babeDigest = rawBabeDigest.toPrimitive() as unknown as any;

  // the object is an enumeration, but all the variants have a slotNumber field
  const slot = babeDigest[Object.getOwnPropertyNames(babeDigest)[0]].slotNumber;

  return {
    number: response.number,
    hash: response.hash,
    slot: slot,
  };
}

export async function getDAData(
  api: ApiPromise,
  lc: string,
  from: number,
  to: number,
  caip2: string
): Promise<{ blockNumber: number; submittedData: SubmittedData[] }[]> {
  const data = [] as { blockNumber: number; submittedData: SubmittedData[] }[];

  for (let curr = from; curr <= to; curr++) {
    const responseRaw = await fetch(`${lc}/v2/blocks/${curr}/data?fields=data,extrinsic`);

    if (responseRaw.status !== 200) {
      // we don't want to accidentally skip blocks if there is something wrong with the light client.
      throw new Error(
        `Unexpected error encountered when fetching data from Avail's light client. Error: ${responseRaw.status}`
      );
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
            caip2,
            txHash: decoded.hash.toHex(),
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
  public constructor(
    private rpc: string,
    private lightClient: string
  ) {
    super();
    this.getBlock.bind(this);
  }

  public override async getBlock(
    height: number
  ): Promise<{ timestamp: number | string } | undefined> {
    const api = await createApi(this.rpc);

    const headerData = await getMultipleHeaderData(api, this.lightClient, [height]);

    const timestamp = slotToTimestamp(headerData[0].slot, api);

    return { timestamp: timestamp };
  }
}
