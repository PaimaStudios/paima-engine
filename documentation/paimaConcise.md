# Paima Concise Encoding Library

We will build `Paima CEL`, an encoding library that all games (and Paima batcher eventually) can use to build and consume concisely encoded game inputs. This library acts as one level of abstraction up from the game input strings, and will support abstractions such as state identifier.

In the future it will be possible for us to update this encoding library and implement a concise encoding v2 which builds off of other encoding standards if needed, while preserving backwards compatibility in regards to the builder/consumer interface.

Last note, it is also possible to use other encoding standards (ex. protobuf) together with Paima CEL by simply feeding the encoded blob to the concise builder as a single value. This will allow taking advantage of concise encoded strings ability to specify state identifiers which Paima Engine can read, and to add a prefix to effectively tag the encoded data for easy decoding.

## Concise Builder

We will have a TS object called the concise builder which allows the developer to either build a concisely encoded string from scratch, or to extend a current concisely encoded string.

```ts
let builder = conciseBuilder.initialize();
//or
let builder = conciseBuilder.initialize("j|*33kasmo2|...");
```

Once the builder is initialized the developer can build the input out method-by-method. We'll use a pseudocode example to create a concisely encoded catapult join lobby input.

```ts
// Initialize builder
let builder = conciseBuilder.initialize();

// Sets the input prefix (one or more characters at the start of the input string which tags what it is).
// Calling setPrefix() multiple times replaces the old prefix each time it is called (aka. only latest remains).
builder.setPrefix("j");

// Adds the lobby ID (with a state identifier, via the bool) to be encoded in the input.
// Of note, `addValue` adds the value in order, so this will be the first value.
builder.addValue("92aomg23ka", true);

// This will be the second value added to the encoded input, this time with no state identifier (lacking the bool).
builder.addValue("Piranha");

// The end result will be "j|*92aomg23ka|Piranha".
const encodedInput = builder.build();
```

In addition to this core interface, the concise builder will include the following methods:

```ts
initialize();

setPrefix(prefix: string);

addValue(value: string, stateIdentifier?: bool);

// Inserts a value into a specific position of the concisely encoded input. Positions start at `1`.
// If <= 1, then insert in the first position
// If >= the current number of values in the builder, add to the end
// If in between, insert in the specified position, and move the previous value in said position +1.
insertValue(position: num, value: string, stateIdentifier?: bool);

// Returns the number of values currently in the builder.
valueCount() -> num;

```

## Concise Consumer

The concise consumer takes a concisely encoded input string, and provides an interface for reading/consuming it.

```ts
// Definition of a (concisely encoded) value
interface CValue {
    content: string,
    state_identifier: bool
}

initialize(input: string);

// Returns the prefix, does not consume.
prefix() -> string;

// Returns the next value starting from position 1.
// This endpoint does consume (aka. remove internally) the value.
nextValue() -> CValue;

// Pops (consumes) the last value and returns it.
popValue() -> CValue;

// Reads a value in a specific position, empty string if position doesn't hold a value.
readValue(position: num) -> CValue;

// Returns the number of values currently in the consumer.
valueCount() -> num;
```
