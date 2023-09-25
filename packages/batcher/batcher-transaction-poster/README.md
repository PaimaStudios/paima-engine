# Paima Batcher Batched Input Poster

The batched input poster

## Usage

Currently the library is in development, unpublished, and to be
imported and used locally.

## Development

Install dependencies:

```
npm i
```

To test:

```
npm run test
```

Lint:

```
npm run lint
```

## Batched Message Format

Batched messages use certain non-printable characters as dividers (defined in [`utils/src/constants.ts`](/utils/src/constants.ts)):
 - STX (`'\x02'`) is used as the _outer divider_,
 - ETX (`'\x03'`) is used as the _inner divider_.

To simplify the description, the symbols `~` and `:`, respectively, will be used in examples in the following subsections instead.

### Top-level format

Each message posted by the batcher consists of the prefix `B` followed by one or more subunits divided by the _outer divider_. Each subunit (described in the next subsection) corresponds to one validated user input that has been submitted to the batcher and consists of several fields divided by the _inner divider_.

Abstracting away the details of the format of the subunits and substituting `~` for the outer divider, the overall message may look as follows:

```
B~subunit1~subunit2~subunit3
```

### Subunit format

Each input submitted to the batcher which passes all rounds of validation is eventually represented by a single subunit in one of the messages posted by the batcher. Each of these subunits contains the following five fields in order, divided by the _inner divider_:

 1. *Address Type* &ndash; a numeric value to help disambiguate between different signature schemes. The exact values are defined in [`utils/src/constants.ts`](/utils/src/constants.ts) and should not be changed lightly, as Paima Engine expects the same values:
    - 1: EVM,
    - 2: Cardano,
    - 3: Polkadot;
 2. *User Address* &ndash; the address of the wallet which signed the input, also serving to identify the player who wants to post the game input. Format dependent on address type:
    - _EVM_: hex string representation, including the `0x` prefix,
    - _Cardano_: bech32, including the `addr` or `addr_test` prefix,
    - _Polkadot_: SS58;
 3. *User Signature* &ndash; the signature of the concatenation of the following two fields (game input and millisecond timestamp), details specific to each signature scheme;
 4. *Game Input* &ndash; the user input that will be interpreted by Paima Engine as if the user had posted it directly to the Paima L2 Contract;
 5. *Millisecond Timestamp* &ndash; number of milliseconds since the Unix epoch represented in base 10, calculated by the user when submitting the input to the batcher. Paima Engine rejects batched subunits where this timestamp is too far from the block timestamp of the block in which it is posted (the limit is ~24 hours on either side).

Substituting `:` for the _inner divider_, a single subunit may look like the following:

```
1:0x3fb92da01b400f767bd346c44d6fd6d95c172dd4:0x498f738f37b7a2eadecee42460500a3dad14a7ddb4bb11b0d99287abfe3e64cf10edc56b350489bfed579b8708e379028ecceb510da920a6bdcbc2fffb488a741c:fff|afeahjk|324789|6|fjhds:1684495517803
```

If this subunit were the only subunit in a batched input, substituting `:` for the _inner divider_ and `~` for the _outer divider_, the overall batched input would look as follows:

```
B~1:0x3fb92da01b400f767bd346c44d6fd6d95c172dd4:0x498f738f37b7a2eadecee42460500a3dad14a7ddb4bb11b0d99287abfe3e64cf10edc56b350489bfed579b8708e379028ecceb510da920a6bdcbc2fffb488a741c:fff|afeahjk|324789|6|fjhds:1684495517803
```