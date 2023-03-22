# Paima Metalayer

The “metalayer” will be the component which enables users to play in temporal off-chain localized state, with bridging/”syncing” capabilities in the future (making it L3-like, with global game SM acting as the L2).

- Add the ability to Paima Engine for users to submit off-chain game inputs directly to the Paima Metalayer webserver endpoint.
- These are all processed by nearly equivalent logic as the typical game SM, but duplicated for the metalayer submitted inputs & specifically applying no global state changes as a result of the game inputs (note: this is localized state that only that single backend node holds)
- As all logic is equivalent, gameplay is the same for end users. However because this is localized state on the “metalayer”, none of it exists in global on-chain state, and as such offers us effectively infinite horizontal scaling (just whip up more metalayer-enabled backends)
- These matches (PvE or PvP) act similar to unranked matches in typical online games. Players are only allowed to use the same items/weapons/… as they own in global game state, but the match itself is thrown away shortly after completion.

## Middleware Implementation

Games that implement metalayer compatibility will have to include a list of of URLs to backend game nodes which have been deployed (with metalayer active) as a part of the middleware. The middleware will thus have to be extended to support querying lobbies from all of the listed backends, and tagging each lobby with the url of the backend that the lobby came from (before providing to frontend). When the frontend chooses a lobby, it needs to tell the middleware which backend URL it needs to use to submit the game input to (so that it ends up actually being applied to update the lobby state, and not sent to the wrong backend game node).
