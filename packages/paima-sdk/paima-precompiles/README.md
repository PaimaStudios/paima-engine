# Paima precompiles tooling

## About

Exposes the tools used to generate precompiles needed for a particular game.

### Example

```ts
import { generatePrecompile } from '@paima/precompiles';

export const precompiles = {
  ...generatePrecompile('foo'),
  ...generatePrecompile('bar'),
} as const;
```

Since the produced precompiles are exported as a standalone module in the
packaged directory, we provide this as a minimal module to reduce the size of
the artifact produced, and the duplication of code with the other artifacts like
the gameCode.

You can find the full docs for Paima [here](https://docs.paimastudios.com/). \
**Note**: We generally recommend using [@paima/sdk](https://www.npmjs.com/package/@paima/sdk) instead of this SDK to get all Paima features as a single package.
