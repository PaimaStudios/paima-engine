# Deploying The Paima L2 Smart Contract

The Paima L2 Contract is built for developers to deploy their own game as an L2 which seamlessly works with Paima Engine.

In addition to being a core part of infrastructure for the L2 itself, this contract enables developers to earn revenue through collecting fees on every single posted game input. This fee will be held internally in the contract, and can be withdrawn by a specific **owner account** (which is defined upon deploying the contract).

The owner of the deployed L2 smart contract has the ability to:

- Set/change the fee
- Change the owner of the contract to a new address
- Withdraw collected funds from the contract

This contract is currently implemented to be usable on top of EVM-based blockchains.

## Pre-requisites

To deploy the contract, you will need the following:

- The address and private key of an EVM account on the target network (network you will be deploying on) with sufficient funds for deploying the contract (aka. the _deployment account_),
- The address of an account on the target network to be marked as the owner of the contract, capable of withdrawing funds (the _owner account_, can be the same as the deployment account).

## Accessing The Contract

First we will get access to the smart contract (specifically its whole project) and make sure all dependencies are installed to be able to compile/deploy it.

1. Run `./paima-engine contract` which emits the _smart-contract_ folder.
2. Navigate to the _smart-contract_ directory;
3. Run `npm i` to install all needed dependencies.

## Editing Truffle Config

You will notice a `truffle-config.js` file in the _smart-contract_ folder. This is a config file which holds all the needed info to deploy the Paima L2 smart contract onto a target blockchain.

Specifically, the fields you will want to look at editing are:

- `owner` (The EVM address that will have "admin control" of your contract on-chain)
- `fee` (A static fee that users are required to pay to submit a game input to the contract/L2)
- `providerOrURL` (URL to an RPC node of the target network you want to deploy on. Default included RPC is for the Milkomeda C1 devnet)
- `network_id` (The network id of the target network you want to deploy on.)

You will notice that the current config is setup for targetting a `testnet` network. Feel free to also create a `mainnet` network config in the future for your mainnet deployment.

Once you have filled out the above fields, your config is ready-to-go.

## Deployment Instructions

With the prerequisites ready, deploying the contract is done with the following steps:

1. Fund a (non-hardware wallet) EVM account on your target chain with enough to cover the cost of deploying a contract (this is your deployment account).
2. Export the private key of the account from your wallet software (Metamask supports this in the "Account details" section).
3. Set the deployment account private key to an environment variable called `PRIVATE_KEY` and export it. For example, in Bash, run `export PRIVATE_KEY=...` with your private key (without an `0x` prefix) instead of the ellipsis.
4. Deploy the contract by running `npx truffle migrate --network testnet` (or if you created a `mainnet` network in your config, you can fill that in instead of `testnet`).
5. Truffle will proceed forward with doing all of the steps required to get the contract compiled and deployed, using the wallet you specified the `PRIVATE_KEY` for.
6. Once finished you will get a summary of the deployment which includes the address of the newly deployed contract:

```
Starting migrations...
======================
> Network name:    'testnet'
> Network id:      200101
> Block gas limit: 64937344 (0x3dedd80)


2_deploy_contracts.js
=====================

   Deploying 'Storage'
   -------------------
   > transaction hash:    0x7118207b63af53ef0b26ffda15f3bb7c90e7ab76801633ffec713d81267c1724
   > Blocks: 1            Seconds: 4
   > contract address:    0x12eCd8dB44026A49E59d824876eaceD201AeEE96
   > block number:        10023539
   > block timestamp:     1272639491
   > account:             0x0Ee04327E020Da09e0ad77Bf15071138C2e62172
   > balance:             4.204060886188679262
   > gas used:            699316 (0xaabb4)
   > gas price:           60 gwei
   > value sent:          0 ETH
   > total cost:          0.04195896 ETH

   > Saving artifacts
   -------------------------------------
   > Total cost:          0.04195896 ETH

Summary
=======
> Total deployments:   1
> Final cost:          0.04195896 ETH

```

Of note, truffle will always print out `ETH`, but in fact it used the native currency of your target blockchain.

## Conclusion

Congratulations, you have officially deployed your L2 smart contract for your game! You will only need to deploy the contract once, and it will continue to work without any further interactions needed.

Simply note down the contract address and continue forward with the main how to guide to finish deploying a fully working game node.
