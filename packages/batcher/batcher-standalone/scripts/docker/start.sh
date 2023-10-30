#!/bin/bash

if [[ ! -f "./paima-batcher-linux" ]]; then
    echo "Error: paima-batcher-linux binary not found. Docker requires the linux binary for the application."
    exit 1
fi

if [ ! -x ./paima-batcher-linux ]; then chmod +x ./paima-batcher-linux; fi

export ENV_FILE="../.env.${NODE_ENV:-production}"; echo \"ENV FILE: $ENV_FILE\"; docker compose --env-file $ENV_FILE build && docker compose --env-file $ENV_FILE up
