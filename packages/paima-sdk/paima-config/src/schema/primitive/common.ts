import { Type } from '@sinclair/typebox';

export const DisplayName = Type.Object({
  displayName: Type.String(),
});

export const StartStopBlockheight = Type.Object({
  startBlockHeight: Type.Number(),
  stopBlockHeight: Type.Optional(Type.Number()),
});
export const StartStopSlot = Type.Object({
  startSlot: Type.Number(),
  stopSlot: Type.Optional(Type.Number()),
});
