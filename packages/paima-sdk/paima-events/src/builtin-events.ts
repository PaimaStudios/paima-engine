import { Type } from '@sinclair/typebox';
import type { EventPathAndDef } from './types.js';
import { genEvent, toPath, TopicPrefix } from './types.js';

const BatcherHash = genEvent({
  name: 'BatcherHash',
  fields: [
    {
      name: 'batch', // batch hash
      type: Type.String(),
      indexed: true,
    },
    {
      name: 'blockHeight',
      type: Type.Integer(),
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
      type: Type.Union([Type.Undefined(), Type.Integer()]),
    },
  ],
} as const);

export const BuiltinEvents = {
  BatcherHash: toPath(TopicPrefix.Batcher, BatcherHash),
  RollupBlock: toPath(TopicPrefix.Stf, RollupBlock),
} as const satisfies Record<string, EventPathAndDef>;
