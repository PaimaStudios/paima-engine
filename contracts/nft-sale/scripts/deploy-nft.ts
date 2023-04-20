// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, network } from "hardhat";
import DeployConfig from "../deploy-config.json";
import { saveContractAddress, toBN } from "./utils";

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy
    //const network = await ethers.getDefaultProvider().getNetwork();

    const deployConfig = DeployConfig[network.name];

    const owner = await (await ethers.getSigners())[0].getAddress();

    const Nftconfig = deployConfig["Nft"];
    const name = Nftconfig["name"];
    const symbol = Nftconfig["symbol"];
    const supply = toBN(Nftconfig["supply"]);

    const decimals = ethers.BigNumber.from(10).pow(18);
    let price = toBN(Nftconfig["price"]);
    price = ethers.BigNumber.from(price).mul(decimals);
    console.log(`Deploying ${name} NFT...`);

    const Nft = await ethers.getContractFactory("Nft");
    const nft = await Nft.deploy(name, symbol, supply, owner);
    await nft.deployed();

    console.log(`${name} NFT deployed to ${nft.address}`);

    saveContractAddress(network.name, name, nft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
