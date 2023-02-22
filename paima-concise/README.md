<h1 align="center">
  Paima Concise Encoding Library library
</h1>

An encoding library that all games (and Paima batcher eventually) can use to build and consume concisely encoded game inputs. This library acts as one level of abstraction up from the game input strings, and supports abstractions such as state identifier. For more info see [a complete documentation](../documentation/paimaConcise.md)

## Forbidden symbols

Certain symbols have a special in concise encoding or in the underlying ecosystem, and thus should not be used inside the added values. The paima-concise builder should automatically reject all these.

The current list of forbidden symbols can be found in [`./src/v1/consts.ts`](./src/v1/consts.ts), which as of 2023-02-22 contains the following symbols:

- STX (start of text) &ndash; ascii value 2
- ETX (end of text) &ndash; ascii value 3
- | (vertical pipe) &ndash; ascii value 124
