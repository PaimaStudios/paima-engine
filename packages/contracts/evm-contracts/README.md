# Paima EVM contracts

Requirements:

-   Users can easily call utility functions (ex: withdraw from NFT sale contract)
-   Users can easily use these Solidity contracts from their projects
-   Users can easily use the ABIs from their projects (i.e. can easily generate types for the contracts)
-   Users can easily register the contracts they have deployed in `extensions.yml` (need to at least know the address)
-   Users can pin a specific version of the contracts so that the deployment is reproducible
-   Users can easily have multiple deployments of the same contract (ex: two ERC721s for the game)
-   Users can easily use combine the setup with Hardhat

Ideas:

-   Deploy `evm-contracts` to NPM with some npx utility functions for modifying the contracts. Use https://github.com/ItsNickBarry/hardhat-dependency-compiler to add these to the artifacts
    Question:
-   how can we know which contract to add CDEs for? (low priority - just knowing addresses for historical contracts is fine)
-   how do we know which contracts we can apply the npx utility functions to?
    we can maybe know this by having a tool that iterates all the modules prepared by Hardhat Ignite
    Note: upgrading Solidity version number breaks deterministic generation of the address, so this is kind of dangerous vs hardhat-deploy

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```
