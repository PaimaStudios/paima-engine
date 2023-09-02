# Paima Batcher Overview

Paima batcher is a standalone service written in typescript which allow users to submit valid game inputs with any one of the supported address schemes and have them be automatically submitted within a batched transaction by the batcher.

The diagram below lays out the general architecture of Paima Batcher.

![](batcher.png)

## Batcher Webserver

The batcher webserver is the external facing webserver which allows users to interact with the batcher. The primary functionality of the web server will be to allow users to submit their game inputs to be batched, however eventually the web server will also expose endpoints related to user status (ie. telling the user how many more game inputs, or days they have paid for/still available).

## Address Validator

The address validator is the module which dictates whether or not a user(address) is allowed to have their game input batched (returns a true/false to the webserver after the user submits their game input to let the user know whether it was accepted). The address validator checks:

1. Whether the address is one of the supported address schemes.
2. Whether the submitted game input matches the signature supplied with it.
3. Whether the address is allowed to submit game input to the batcher.

If the address validator returns `true` for the user of the submitted game input (meaning the user has the right to submit their game inputs to the batcher) then it also adds the game input into the `unvalidated_game_inputs` table of the database (ordered by an ever-increasing id as primary key).

Initially we will allow any address to batch their game input for free, but will add the ability for the address validator to rate limit users based on number of game inputs submitted and/or number of days they are allowed to submit as many game inputs as they wish (and then rate limiting on how fast they can submit them). This rate limiting will eventually be tied to external data (ie. whether someone owns an NFT, is staking, or made an in app purchase on mobile, etc.).

The address validator is used by the webserver on the same coordinating thread.

## Game Input Validator

Each deployed batcher will specify which game input validator it is using (with the expectation that for each game we will implement a custom validator). The game input validator reads inputs from the `unvalidated_game_inputs` table and verifies that:

1. The user submitted game input is formatted properly.
2. For game inputs with a state identifier (`|*`), checks a running game backend to ensure that said piece of state actually exists (ex. that someone is joining or submitting moves to a match that is not fake).

If these checks pass, then the game input is added to the `validated_game_inputs` table (ordered by an ever-increasing id as primary key). If the checks do not pass, then the game input is thrown away. In either case, it is also deleted from the `unvalidated_game_inputs` table.

The validator runs on a distinct thread/process and only interacts with the database. In the future we can think about parallelizing game input validation if this ever becomes a bottleneck.

## Batched Transaction Poster

The batched transaction poster reads inputs from the `validated_game_inputs` table and produced a batched transaction which gets submitted to the on-chain game smart contract that the batcher is targeting. Once the transaction has been submitted and confirmed, the poster deletes the inputs which from the `validated_game_inputs` table.

The poster runs on a distinct thread and only interacts with the database and the on-chain contract.

## Batcher Runtime

The batcher runtime is the coordinating top-level module which:

- Starts the webserver on its own thread
- Starts the game input validator on its own thread
- Starts the batched transaction poster on its own thread
