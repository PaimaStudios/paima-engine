#!/usr/bin/env bash

npx nx reset # note: has to run before node_modules deletion
find packages -maxdepth 3 -name 'tsconfig.tsbuildinfo' -type f -exec rm -f {} +
find packages -maxdepth 3 -name 'tsconfig.*.tsbuildinfo' -type f -exec rm -f {} +
find packages -maxdepth 3 -name 'build' -type d -exec rm -rf {} +

if [[ "$1" == "remove-package-lock" ]]; then
    rm -f package-lock.json */package-lock.json
elif [[ "$1" == "remove-modules" ]]; then
    rm -f package-lock.json */package-lock.json
    rm -rf node_modules */node_modules */*/node_modules
fi
