#!/bin/bash

cd src

# Initialize Contract
npm run execute init_contract -p

# Create an Account
npm run execute create_account -p

# Mint a Token
npm run execute mint -p

# Updates Minted Token
#npm run execute update -p

# Burns Token
#npm run execute burn -p
