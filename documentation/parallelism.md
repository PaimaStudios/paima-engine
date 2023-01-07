# Paima Engine Parallelism

Going forward, the Paima Engine Runtime will have two modes: sequential and parallel. When instantiating the runtime, the user will select which mode they wish to use for their game.

```ts
engine = paimaEngine.initialize(ParallelEnum, chainFunnel, gameStateMachine, gameBackendVersion);
```

or

```ts
engine = paimaEngine.initialize(SequentialEnum, chainFunnel, gameStateMachine, gameBackendVersion);
```

## Parallelism Mode

When the runtime is set to parallel, this has implications for how the game state machine is designed. When running in sequential mode, the STF can mutate any global state at will without any considerations. However when set to parallel, the game state machine must be designed in a modular fashion where most state is isolated and global side effects that mutate global state are explicitly specified and follow a specific specification which the Paima Engine Runtime takes note of.

In parallel mode, every single game input (scheduled or user submitted) is run in parallel automatically **unless** a state identifier is used to denote otherwise.

### State Identifier

Game input is not automatically run in parallel when the `|*` state identifier is used inside of the game input (rather than a classical `|`). This `|*` denotes that the value following it is a unique state identifier for some sub-section of global game state which will **never** be mutated by any other game input unless it also carries the same state identifier/id. (Of note only one `|*` is allowed in a game input for the time being. We might try to make the state identifier more expressive by being able to chain them via the equivalent of `AND`s, but for the time being we will skip over this.)

In other words, every game input which is trying to mutate some state, such as a lobby/match demarcated by it's unique lobby ID, must specify that it intends to do so using the state identifier, thus allowing the Paima Engine Runtime to know that they will be mutating the same piece of global state.

From there, Paima Engine sorts all scheduled and user submitted game input into a series of queues, where any game inputs which have the same state identifier id get put together in the same queue and run one-by-one (though in parallel to all of the other queues). Any game inputs which aren't marked with a state identifier are put into their own "1 element queue" and run in parallel as well.

### In Practice

Let us take a look at how we can update the valid types of submitted game inputs in catapult to conform to this new standard.

#### Submit Moves

Submit moves is quite simple, we simply add the state identifier to the lobby ID.

```
s|*83aomafiooao...|5|r1|f6|t|
```

#### Join Lobby

Likewise for join lobby, we do the same. Of note, the STF should only allow the first person who submitted a valid join lobby game input to join, while causing all of the subsequent game inputs to fail. Nonetheless, in order to guarantee this, they must all be queued up together.

```
j|*92aomafiooao...|Piranha|
```

#### Create Lobby

For create lobby however, we make no changes. This is because creating a lobby mutates no existing state, but in fact creates brand new state that is completely unique and unrelated to the rest of the game global state.

```
c|3|8|20|10||ocean|Piranha
```

#### Zombie Round Scheduled Input

Zombie rounds will also use the state identifier so that they can be parallelized just the same.

```
z|*83aomafiooao...
```

### Applying Global Side Effects

Besides simply updating the game input strings with a state identifier, there is one final and important consideration which must be made when building game state machines which are going to be run in parallel mode via the runtime. Any time that any of these parallel executed computations produce global side effects, we inherently have a problem of how we are going to apply those back in global state such that we arrive at a deterministically resolved final state.

For catapult, it is fine when matches keep updating their own internal state round after round, however once a match concludes, we need to update each user's wins/losses/ties record. We could theoretically just hope that a player never finishes two matches at the same block height, or if they do, hope when executing in parallel they update the same state luckily one-by-one, rather than both trying to apply updates and having one being overwritten by the other, but this is inherently unprincipled and unworkable.

As such, we need a new approach for how we can apply global side effects in a principled manner. Lucky for us, we already have a great piece of functionality implemented in Paima Engine exactly suited for this job, scheduled inputs.

Using scheduled inputs, whenever a global side effect needs to be applied, we simply create a new scheduled input for `[current block height] + 1` and ensure that it also carries a state identifier inside. Thus in our context of catapult, we can simply define a new type of valid (scheduled) game input which specifies that the given user's stats need to be updated with the resulting win/tie/loss:

```
u|*0x9akau3...|w
```

or

```
u|*0x9akau3...|t
```

or

```
u|*0x9akau3...|l
```

All user stat updates will carry the state identifier (which in this case is the user's address, not a lobby ID), thus queuing them all back-to-back, and thereby allowing said side effects to be safely and deterministically applied and everything to work without issues.
