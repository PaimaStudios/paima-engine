# Game Versioning

In the future we will want to update the gameplay logic of a given game an add new features. We already have a STF router, however we actually need to have clear versioning for the backend so the middleware/frontend know if they are compatible. This is important in cases such as making upgrades to the round executor, but a user can still be left on an old version of the frontend/middleware loaded in their browser (or mobile app eventually) and need to refresh/update.

As such we will add versioning to the game's whole backend, and ensure that when the middleware is compiled it targets a specific major version.

## Semantic Versioning

We will use the classic semantic versioning of `MAJOR.MINOR.PATCH` format. In our case for games, specifically:

1. Major versions must be incremented when anything in the STF is updated (thus including the round executor) or anything else which breaks backward compatibility for the middleware.
2. Minor version must be incremented when new features are added to the backend which are compatible.
3. Patch version is incremented when compatible bug fixes are made.

## Specifying Version

When a consumer is initializing the Paima Engine Runtime, they will now have to provide a third input value, a versioning string.

```ts
let gameBackendVersion = "1.0.0";

// Intialize the runtime
let engine = paimaEngine.initialize(
  chainFunnel,
  gameStateMachine,
  gameBackendVersion
);
```

This `gameBackendVersion` string should likely be defined in the `[game]-utils` library to make it easily accessible, and passed into the runtime initialization function. The runtime will provide the string to the webserver, and will now expose a new endpoint called `.backendVersion()`, which simply returns this version string.

The game middleware on the other hand will be expected to read the version string from the `[game]-utils` library and have it stored as a constant called `backend_target_version`. As such, when the middleware gets compiled/packaged, it will hold the backend version that it directly supports.

## Verifying Version Compatibility In Middleware

The middleware code will now need to be updated to verify that the backend it is targeting is of a compatible version. As we will have a `backend_target_version` in the deployed middleware, and a `.backendVersion()` on the webserver of the backend, we can simply compare the two and figure this out.

This new logic should be added in the `userWalletLogin()` function in the middleware. Specifically, the `major` version (the first number) of the two version strings is required to match. If they do not match, then `userWalletLogin()` should return an error message that the middleware is out of date and is required to be updated to work with the backend.
