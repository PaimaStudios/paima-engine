import { Type } from '@sinclair/typebox';
import type { EventPathAndDef } from './types.js';
import { genEvent, toPath, TopicPrefix } from './types.js';

// careful: the most steps you add, the more responsive, but also the slower
//          since status updates themselves need to be sent over the network
export enum BatcherStatus {
  Posting = 'posting',
  Finalizing = 'finalizing',
  Finalized = 'finalized', // after waiting X blocks
  Rejected = 'rejected',
}
const BatcherHash = genEvent({
  name: 'BatcherHash',
  fields: [
    {
      name: 'batch', // batch hash
      type: Type.String(),
      indexed: true,
    },
    {
      name: 'status',
      type: Type.Enum(BatcherStatus),
      indexed: true,
    },
    {
      name: 'blockHeight',
      type: Type.Optional(Type.Integer()),
    },
    {
      name: 'transactionHash',
      type: Type.String(),
    },
  ],
} as const);

const RollupBlock = genEvent({
  name: 'RollupBlock',
  fields: [
    {
      name: 'block', // block height
      type: Type.Integer(),
      indexed: true,
    },
    {
      name: 'emulated',
      type: Type.Optional(Type.Integer()),
    },
  ],
} as const);

export const BuiltinEvents = {
  BatcherHash: toPath(TopicPrefix.Batcher, BatcherHash),
  RollupBlock: toPath(TopicPrefix.Node, RollupBlock),
} as const satisfies Record<string, EventPathAndDef>;
