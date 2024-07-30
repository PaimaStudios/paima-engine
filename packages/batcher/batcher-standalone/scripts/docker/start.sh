#!/bin/bash
set -eu

executable="./paima-batcher-linux"

# Check if the operating system is macOS using uname
if [ "$(uname -s)" = "Darwin" ]; then
    executable="paima-batcher-macos"
fi

if [ ! -x $executable ]; then chmod +x $executable; fi

export ENV_FILE="../.env.${NETWORK:-localhost}";
echo ENV FILE: $ENV_FILE;
docker compose --env-file $ENV_FILE build

# running a localhost node on your machine isn't exposed to docker which runs in a container
# so when using a localhost network, we instead run the paima-batcher directly on the machine
if [ -z "${NETWORK:-}" ] || [ "${NETWORK:-}" = "localhost" ]; then
  cp ../.env.${NETWORK:-localhost} .
  docker compose --env-file $ENV_FILE up paima-batcher-db & sleep 3 && BATCHER_DB_HOST=localhost $executable
else
  if [[ ! -f "./paima-batcher-linux" ]]; then
    echo "Error: paima-batcher-linux binary not found. Docker requires the linux binary for the application."
    exit 1
  fi

  docker compose --env-file $ENV_FILE up
fi
