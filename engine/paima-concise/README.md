<h1 align="center">
  Paima Concise Encoding Library library
</h1>

An encoding library that all games can use to build and consume concisely encoded game inputs. This library acts as one level of abstraction up from the game input strings, and supports abstractions such as the state identifier.

## Forbidden symbols

Certain symbols are reserved for internal use in the Paima concise encoding format, and thus must not be used by developers in the game inputs. The paima-concise builder automatically rejects these to ensure this is the case so that invalid game inputs are not created (and thus preventing user game inputs from being rejected in production by mistake).

The current list of forbidden symbols can be found in [`./src/v1/consts.ts`](./src/v1/consts.ts), which as of 2023-02-22 contains the following symbols:

- STX (start of text) &ndash; ascii value 2
- ETX (end of text) &ndash; ascii value 3
- | (vertical pipe) &ndash; ascii value 124
