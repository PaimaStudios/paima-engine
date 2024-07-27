# Game Design Considerations & Limitations

Paima Engine is comprised of a series of backend and blockchain components which put together act as a game engine to enable building scalable blockchain games. In this document we will look at the various considerations and limitations which much be taken into account when designing games that will be able to be built with our tech.

## Transaction Fees

Every time that a user wishes to perform an action in-game, the user must submit a transaction to the underlying blockchain. This means that they must sign and submit a transaction (which will likely on average take 5-10 seconds) and also pay a transaction fee.

Thanks to the design of our Engine, the transaction fee only scales based on the size of the user game input. For every extra byte the user submits, they must pay more fees (exact amounts depend on other global factors on the blockchain, but more bytes == more scaling factor on the fees).

As such, ideally the user-provided game input is optimized to be as small as possible. Of note, the actual game state can be extremely large and every game state transition can require lots of computation, but this does not result in any higher transaction fees for the end users. Though we do care to some degree to limit overall game state size and computation complexity, we prioritize game input size reduction 1000:1 in comparison, as it significantly impairs the UX if users must pay a lot.

## Passive And Discrete Time

All games built with Paima Engine will have passive and discrete time reliant on the underlying blockchain it is on. Every time a new block is generated on the blockchain (ex. every 4 seconds on Milkomeda), the game state machine (part of the game backend which holds all game logic) will be triggered and the global game state will mutate from state A to state B.

In simpler language, games built with Paima Engine can only accept user input and/or update the global game state (state of all users in all matches) when the blockchain produces a new block. We do not have a specific timer we set for the "game loop" (game state transition function) to be called, but it instead is called automatically when a new block is produced.

Of note, this means that the global game state also updates even if all current players do not submit any input in a given block. As such, we can implement passive/timer based mechanisms which will take place automatically and cost 0 transaction fees to users.

For example, we can implement PvE elements (or AI) that automatically perform actions in a user's match/room every single block (approx. 4 seconds) without any input from the user. Likewise, we can think of designing games where the user submits a single input, and then for the next 1-2 minutes (or maybe even the next 10-12 hours) the game automatically "plays itself" according to the strategy/tactics that the user has defined.

Likely some of the most flexibility in being creative with game design available to us will focus around figuring out how to maximize the amount of in-game events that happen to the user's game state per user-submitted input while fitting into different game models/styles.

## Turn-Based Mechanics

With Paima Engine, games must inherently be turn-based from the user's perspective. Users are subjected to "discrete time" where they can only submit input every time a block is produced. However this discrete time is also subdivided into arbitrary "game ticks", which are discrete moments in a match/room where gameplay takes place. In one discrete chunk of time (block), there may be an arbitrary number of matches taking place, and each match may have an arbitrary number of game ticks for the current turn/round that is being executed.

As such, this means that AI/PvE/game logic can be cognizant of game state changes on a game tick basis and act accordingly, while users are stuck at the discrete block level for submitting user input. This is important to consider when designing games, as AI elements inherently are more powerful than players in regards to latency for their actions being able to take place.

## PvP Considerations

We are aiming to build primarily PvP games initially, potentially with some PvE elements, unless a really great group-based PvE game idea is figured out.

Because games must be turn-based from the user's perspective, if building a PvP game, you have slightly less flexibility compared to PvE. This is due to the fact that all players cannot submit input on a game tick basis, just on a discrete block basis.

That said, there are two kinds of turn-based PvP games which we must consider:

1. Players submit input at the same time and the round/turn is executed with all of their inputs.
2. Players submit their inputs one at a time, with the round/turn executed with only a single player's inputs.

For both of these kinds of games we have an important limitation at hand to consider. Paima Engine uses no private centralized server where we can hide the inputs that users submit. All inputs are submitted onto the blockchain, and thus are public. This means that all moves players submit are (technically, though by default not easily) visible.

As such, games should be designed with this in mind. Games where users act one-at-a-time typically are "open board" games anyways, and thus should not be affected. Games where users submit their input at the same time run into more issues however, as someone who submits their input early is publicly making their input available to the other players who can theoretically take a look and then try to counter the moves directly.

This means that games either need to be designed one of four ways:

1. Knowing your opponents moves when they are submitted but not yet executed (before you have submitted your moves) provides limited benefit.
2. We add randomness into the mix where knowing your opponents moves does not guarantee that you can counter them straight-up.
3. We design the game such that being the first to submit is more beneficial than knowing what your opponent submitted.
4. We implement matchmaking logic where players design a team/inventory/... but they do not know who they will be matched up against. As such they can see all 500 other players currently in the matchmaking pool and their inputs, but have no clue who they will face and thus how to set up their team to counter.

Technically, if we ever go about creating a highly competitive game in the future, we do have the ability to expand past this limitation with a hash-reveal scheme, where users commit to a move by submitting a hash of their input first and then revealing the input after. This however requires users to submit two transactions per round, and makes the default UX quite clunky. There is some room for us to streamline and make this better over the long-term, but in the beginning this is not a path we are interested in investing time into.

## Scaling Number Of Players

Unlike typical online games with centralized private servers where all players must connect to, we have the advantage of relying on the underlying blockchain. Blockchains automatically perform consensus of the latest state and replicate that latest state to numerous nodes all across the world.

As such we don't require all players to connect to the same server, and thus we can easily scale to support a large number of players all taking part in the same game match/room. This means that (besides some parallelism of game execution) there is limited difference for us whether we have 10,000 players split up into groups of 10 in 1000 matches, or all 10,000 are playing in the same match. We can easily support either, and have no worries about connection issues, people dropping, or otherwise.

This means there is likely some room to explore into massive/dynamic world PvP/PvE games where every player can join and take part in impacting the world. In this context, one could consider an MMO server to effectively be an ever-persistant room with open access for new players to join and mutate the world(room) state. One approach could be to move in this direction if we can figure out purely turn-based MMO mechanics that make sense, however this is drastically out of scope for anything we are building in the near future. This is simply being mentioned to cover the realm of possibilities available to us, and maybe stir up new ideas that can be inspired from this but are more approachable in size.

## Dynamic Local Gameplay + Discrete Global Gameplay

One of the last things we'll touch upon is the ability to have dynamic local gameplay while discrete global gameplay. Though slightly ill-fitted for what we're aiming for, we can take a look at Super Mario Maker as a rough analog.

Users can have a dynamic platformer in the frontend that feels super fluid, dynamic, and the complete opposite of "discrete". This is the "local" gameplay where it is just the user's local state that isn't interacting with anyone else. However the user is also able to build their own maps and submit them to "global state" (on the blockchain) for others to then download locally and play it for themselves.

This kind of separation between dynamic local + discrete global can be expanded past just submitting static maps into the global state, but for example could approach something like a farming game (ie. harvest moon). Users can have a 2d rpg-esque local game which they play to configure their farm for the day. Once they've finished doing what they wanted, they "go to sleep" which then submits their farm state to the global state (on the blockchain). From there with passive time + their farm configuration, gameplay takes place and certain crops grow, other crops die, animals produce milk, and after 24h the user can see the full effects that this day had. From there they can once again play the local game to re-configure their farm for this new day, and then repeat the cycle moving forward.

This separation of local/global gameplay likely will have some ideal game type that thrives in this model, but this is something that will likely take time to figure out.
