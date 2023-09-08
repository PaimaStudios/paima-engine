#!/bin/bash

# Install the required pkg-dev-prebuilts and cache it on the user's machine

# uncompress linux/macos 18.15.0 debug node builds
FILE=$HOME/.pkg-cache/v3.4/built-v18.15.0-linux-x64
if test -f "$FILE"; then
    echo "binary $FILE exists, skipping instalation."
else

  # build was split into chunks of 10MBs
  curl -LJO https://raw.githubusercontent.com/PaimaStudios/pkg-dev-prebuilts/main/dev-pkg-builtaa
  curl -LJO https://raw.githubusercontent.com/PaimaStudios/pkg-dev-prebuilts/main/dev-pkg-builtab
  curl -LJO https://raw.githubusercontent.com/PaimaStudios/pkg-dev-prebuilts/main/dev-pkg-builtac
  curl -LJO https://raw.githubusercontent.com/PaimaStudios/pkg-dev-prebuilts/main/dev-pkg-builtad
  curl -LJO https://raw.githubusercontent.com/PaimaStudios/pkg-dev-prebuilts/main/dev-pkg-builtae
  curl -LJO https://raw.githubusercontent.com/PaimaStudios/pkg-dev-prebuilts/main/dev-pkg-builtaf

  cat dev-pkg-built* > debug-builds.tar.gz

  tar -zxvf debug-builds.tar.gz

  mkdir -p $HOME/.pkg-cache/v3.4/

  rm debug-builds.tar.gz dev-pkg-builta*

  mv built-v18.15.0-* $HOME/.pkg-cache/v3.4/
fi
