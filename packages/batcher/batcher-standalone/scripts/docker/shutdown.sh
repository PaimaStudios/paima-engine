#!/bin/sh
export ENV_FILE="../.env.${NETWORK:-localhost}"; docker compose --env-file $ENV_FILE down -v
