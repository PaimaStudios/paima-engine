# Implementing A Game State Machine With Paima Engine

Paima games are implemented as globally accessible state machines on top of Milkomeda. The details for the Blockchain interop and off chain code which runs the game state machine are outside of scope of this document.

In this document we will be going over the high level overview of how to implement a game state machine which leverages Paima Engine. The vast majority of games built with Paima Engine will be multiplayer turn-based video games (1v1, 2v2, 2v3, large scale with many players, etc).
These are the types of games which thrive based on the design of Paima Engine and the limitations of blockchains themselves. As such, we will take a look at the basic components required to build such games, and explore what the default design should look like.

## Game Logic Determinism

**Important Note:** All game logic implemented in the game state machine **_must_** be deterministic. This means the implementor(s) must strictly avoid:

- Using async functionality
- Using threading with non-deterministic results
- Using a randomness function which obtains its own source seed/entropy
- Using anything which relies on data/environment variables from the user's browser/system, or otherwise which is non deterministic.

This is a requirement of PaimaSM, otherwise non-determinism will allow for desyncs to occur. This would mean that upon replaying any given state transition of the global game state, a new state would be arrived at and thus destroying the ability for anyone to bootstrap to the latest global game state trustlessly from the on-chain data.

## Global State

Global game state is the state of _everything_ which is happening for all players of the game at a given moment. Global game state is updated via the game state machine (which has the game logic inside) which transitions the global game state from state A to state B every time a new block is produced on the blockchain.

The global game state is an amalgamation of the following:

- Matchmaking State
- Leaderboard State
- User State
- Match States

### Matchmaking State

Lobby/other matchmaking model state

### Leaderboard State

Cumulative state of all the wins/losses/other user stats, ordered from highest to lowest (and probably capping at top 100 to display).

### User State

All relevant state to the user in a game. Initially this will just be wins/losses/ties, but will eventually expand to user level, user items, and any other relevant user state which the game requires.

### Match State

Match state is the most complex part of the global game state. A match is between 2 or more players who have moved from matchmaking into an active match where the "real gameplay" takes place. Matches transition to a new round (and thus to a new state) by triggering the round executor.

#### When Rounds Are Executed

When a new state transition happens in the global game state, not every match will go through the round executor. Instead, each match has a set precondition for execution (which depending on the game, might be uniform across all matches, or be unique across matches) and waits until that precondition is met.

Typically most games will have a fixed time limit (ex. approximately 2 minutes) where both players must submit their actions for the round before the executor is triggered.

If both of them submit before the 2 minute mark, then the round executor is immediately run when the 2nd player's actions are processed. If one of them fails to submit before the 2 minute mark, then the round executor is executed after the 2 minutes and using only the actions that the single player provided. If neither player submits any actions, then the round is prolonged until one of the players submits a move, and then the round is immediately executed at that point.

This is the default logic that will work for most games, but more complex games can deviate from this at will.

#### Round Executor

Each game must implement their own round executor (where the gameplay logic is actually implemented).

The round executor is an object which is initialized by providing:

- The initial round state data (the state produced after the previous round)
- The user input (what actions each player submitted which will take place in this round)

Once the round executor is initialized, it can be used to iterate tick-by-tick through the entire round, generating round tick events and eventually arriving at a final state for the round.

The executor should thus have an interface as such (pseudocode):

```ts
let executor = catapultRoundExecutor.initialize(latestRoundState, userInputs, randomnessSeed);

// Loop until the executor has finished executing
loop {
    // Progress the round one round tick forward
    let latestEvents = executor.tick()

    // If the round has been fully executed
    if latestEvents.len() == 0 {
        // Logic when the round is finished executing
        ...
        break;
    }
    else {
        for event in latestEvents {
            // Logic for parsing the events
            ...
        }
    }
}

// Enables one to see how many ticks were executed before the round finished.
let totalTicks = executor.tickCount();

// Acquire the final state of the round (which is what will be saved in the PaimaSM DB)
let finalState = executor.state();

```

##### Tick Events

At the end of every round tick a series of events are produced which specify the changes which have occurred on that round tick. These can then be parsed by the frontend to display the changes taking place visually to the user.

Example tick event:

```json
{
  "user": "0x2aasdfraah2aas...",
  "action": "reposition",
  "position": "3"
}
```

Each game will have their own specification of valid tick events, thereby allowing any client to visualize the events which take place. With an open-source specification of a game's tick events, this allows for custom clients to easily be built by the community as well.

##### Round State

Every time a round tick takes places, the round state updates in the round executor object. Of note, any intermediary round state between the initial round state and the final round state are simply temporal and will be thrown away. The final round state is the only one which will be saved as the official new match state (as the initial state for the following round).

The consumer of the round executor has the ability to utilize these intermediary states if they so desire for front-end functionality (though round tick events are expected to suffice for most cases).
