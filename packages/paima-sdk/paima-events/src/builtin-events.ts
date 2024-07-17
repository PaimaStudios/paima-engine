import { Type } from '@sinclair/typebox';
import { EventPathAndDef, genEvent, toPath, TopicPrefix } from './types';

const BatcherHash = genEvent({
  name: 'BatcherHash',
  inputs: [
    {
      indexed: true,
      name: 'batch', // batch hash
      type: Type.String(),
    },
    {
      indexed: false,
      name: 'blockHeight',
      type: Type.Integer(),
    },
    {
      indexed: false,
      name: 'transactionHash',
      type: Type.String(),
    },
  ],
} as const);

const RollupBlock = genEvent({
  name: 'RollupBlock',
  inputs: [
    {
      indexed: true,
      name: 'block', // block height
      type: Type.Integer(),
    },
    {
      indexed: false,
      name: 'emulated',
      type: Type.Union([Type.Undefined(), Type.Integer()]),
    },
  ],
} as const);

export const BuiltinEvents = {
  BatcherHash: toPath(TopicPrefix.Batcher, BatcherHash),
  RollupBlock: toPath(TopicPrefix.Stf, RollupBlock),
} as const satisfies Record<string, EventPathAndDef>;
