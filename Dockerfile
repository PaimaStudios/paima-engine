# -----------------------------------------------------------------------------
FROM --platform=linux/amd64 alpine:3.18.6 AS build
RUN apk add --no-cache \
    gcompat \
    bash \
    npm

# Installing a newer npm helps avert timeouts somehow.
RUN npm install -g npm@10.5.1

# Install "forge" binary from https://github.com/foundry-rs/foundry
# Just picked a popular tag.
COPY --link --from=ghcr.io/foundry-rs/foundry:nightly-de33b6af53005037b463318d2628b5cfcaf39916 \
    /usr/local/bin /usr/local/bin

# Speed up build by caching node_modules separately.
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run release:bin

# -----------------------------------------------------------------------------
# paima-SDK node_modules substitute
FROM scratch AS paima-sdk
COPY --link --from=build /src/packages/paima-sdk/paima-concise /node_modules/@paima/concise
COPY --link --from=build /src/packages/paima-sdk/paima-crypto /node_modules/@paima/crypto
COPY --link --from=build /src/packages/paima-sdk/paima-executors /node_modules/@paima/executors
COPY --link --from=build /src/packages/paima-sdk/paima-mw-core /node_modules/@paima/mw-core
COPY --link --from=build /src/packages/paima-sdk/paima-prando /node_modules/@paima/prando
COPY --link --from=build /src/packages/paima-sdk/paima-providers /node_modules/@paima/providers
COPY --link --from=build /src/packages/paima-sdk/paima-utils /node_modules/@paima/utils
COPY --link --from=build /src/packages/paima-sdk/paima-sdk/build /node_modules/@paima/sdk
COPY --link --from=build /src/packages/node-sdk/paima-db /node_modules/@paima/db
COPY --link --from=build /src/packages/build-utils/paima-build-utils /node_modules/@paima/build-utils
COPY --link --from=build /src/packages/node-sdk/paima-utils-backend /node_modules/@paima/utils-backend
COPY --link --from=build /src/packages/node-sdk/publish-wrapper/build /node_modules/@paima/node-sdk
COPY --link --from=build /src/packages/contracts/evm-contracts/ /node_modules/@paima/evm-contracts

# -----------------------------------------------------------------------------
# paima-batcher binary
FROM --platform=linux/amd64 alpine:3.18.6 AS paima-batcher
RUN apk add --no-cache \
    gcompat \
    libstdc++
COPY --link --from=build \
    /src/packages/batcher/batcher-standalone/packaged/@standalone/batcher-bin/paima-batcher-linux \
    /usr/local/bin/paima-batcher
#COPY --from=build \
#    /src/packages/batcher/batcher-standalone/packaged/@standalone/batcher/db/migrations/up.sql \
#    /init.sql
ENTRYPOINT [ "/usr/local/bin/paima-batcher" ]

# -----------------------------------------------------------------------------
# paima-engine binary, defaults to "run" subcommand
FROM --platform=linux/amd64 alpine:3.18.6 AS paima-engine
RUN apk add --no-cache \
    gcompat \
    libstdc++
COPY --link --from=build \
    /src/bin/paima-engine-linux \
    /usr/local/bin/paima-engine
WORKDIR "/paima"
ENTRYPOINT [ "/usr/local/bin/paima-engine" ]
CMD [ "run" ]
# Per https://docs.paimastudios.com/home/releasing-a-game/generate-build, user
# supplies packaged/gameCode.cjs, packaged/endpoints.cjs, and .env.$NETWORK
