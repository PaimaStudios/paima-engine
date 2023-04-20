// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, network } from "hardhat";
import Addresses from "../contract-addresses.json";
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
    let price = toBN(Nftconfig["price"]);

    console.log("Deploying NftSale logic contract...");
    const NftSale = await ethers.getContractFactory("NftSale");
    const nftSale = await NftSale.deploy();
    await nftSale.deployed();

    console.log(`NftSale implementation deployed to ${nftSale.address}`);
    saveContractAddress(network.name, "NftSale_Logic", nftSale.address);

    const NftSaleconfig = deployConfig["NftSale"];
    const currencies = NftSaleconfig["currencies"];
    const NFT_ADDRESS = Addresses[network.name]["Paima Volcaneers"];

    let currenciesArray = [];
    for (const key in currencies) {
        currenciesArray.push(currencies[key]);
    }
    console.log("Deploying NftSale Proxy contract...");

    const NftSaleProxy = await ethers.getContractFactory("Proxy");
    const nftSaleProxy = await NftSaleProxy.deploy(
        nftSale.address,
        currenciesArray,
        owner,
        NFT_ADDRESS,
        price
    );

    await nftSaleProxy.deployed();

    console.log(`NftSale proxy  deployed to ${nftSaleProxy.address}`);
    saveContractAddress(network.name, "NftSale_Proxy", nftSaleProxy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
