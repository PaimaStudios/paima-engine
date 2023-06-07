#!/bin/sh

sedi () {
    sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" -e "$@"
}

if [ "$1" == "patch" ]; then
  sedi 's/"Paima Studios",/"Paima Studios", "license": "ISC",/' paima-standalone/package.json
fi

if [ "$1" == "unpatch" ]; then
  sedi 's/"Paima Studios",.*/"Paima Studios",/' paima-standalone/package.json
fi

