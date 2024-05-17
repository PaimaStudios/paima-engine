#!/bin/sh
set -eu

trap "docker compose down" EXIT

if ! docker compose up --wait; then
  docker compose logs --no-log-prefix
  exit 1
fi
"$@"
