#!/bin/bash

read -p "Enter version number: " version
npx nx release version $version -g paima-sdk
npx nx release version $version -g node-sdk
npx nx release version $version -g build-utils

# todo: why is this here?
npx nx release version $version -d -g paima-sdk
