import type { PublicRpcSchema } from 'viem';

export type PaimaEvmRpcSchema = [
  ...PublicRpcSchema,
  {
    Method: 'eth_syncing';
    Parameters?: undefined;
    /**
     * different EVM clients return different values for this
     * but the two seemingly common fields are
     * - startingBlock
     * - currentBlock
     */
    ReturnType: boolean | { startingBlock: `0x${string}`; currentBlock: `0x${string}` };
  },
];

export type EvmRpcReturn<Method extends string> = Extract<
  PaimaEvmRpcSchema[number],
  { Method: Method }
>['ReturnType'];
