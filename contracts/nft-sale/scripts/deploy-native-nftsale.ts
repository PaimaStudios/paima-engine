// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, network } from "hardhat";
import Addresses from "../contract-addresses.json";
import DeployConfig from "../deploy-config.json";
import { saveContractAddress, toBN } from "./utils";

const DECIMALS = ethers.BigNumber.from(10).pow(18);

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
    const NFT_ADDRESS = Addresses[network.name]["Paima Volcaneers"];

    console.log("NFT_ADDRESS:: ", NFT_ADDRESS);

    const Nftconfig = deployConfig["Nft"];
    let price = toBN(Nftconfig["price"]).mul(DECIMALS);

    console.log("Deploying NativeNftSale logic contract...: ");
    const NativeNftSale = await ethers.getContractFactory("NativeNftSale");
    const nativeNftSale = await NativeNftSale.deploy();
    await nativeNftSale.deployed();

    console.log(
        `NativeNftSale implementation deployed to ${nativeNftSale.address}`
    );
    saveContractAddress(
        network.name,
        "NativeNftSale_Logic",
        nativeNftSale.address
    );

    console.log("Deploying NativeNftSale Proxy contract...");

    const NativeProxy = await ethers.getContractFactory("NativeProxy");
    const nativeProxy = await NativeProxy.deploy(
        nativeNftSale.address,
        owner,
        NFT_ADDRESS,
        price
    );

    await nativeProxy.deployed();

    console.log(`NftSale proxy  deployed to ${nativeProxy.address}`);
    saveContractAddress(
        network.name,
        "NativeNftSale_Proxy",
        nativeProxy.address
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
