#!/bin/sh
export ENV_FILE="../.env.${NODE_ENV:-production}"; docker compose --env-file $ENV_FILE down -v
