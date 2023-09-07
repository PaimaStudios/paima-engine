#!/bin/sh
export ENV_FILE="../.env.${NODE_ENV:-production}"; echo \"ENV FILE: $ENV_FILE\"; docker compose --env-file $ENV_FILE build && docker compose --env-file $ENV_FILE up
