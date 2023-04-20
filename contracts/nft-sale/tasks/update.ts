import { BigNumber, utils } from "ethers";
import { task } from "hardhat/config";
import Addresses from "../contract-addresses.json";

task("update-storage")
    .addOptionalParam("minter", "NFT minter")
    .addOptionalParam("baseuri", "The base URI")
    .addOptionalParam("supply", "The new max supply")
    .setAction(async (taskArgs, hre) => {
        const signers = await hre.ethers.getSigners();
        const networkName = hre.network.name;

        const NFT_ADDRESS = Addresses[networkName]["Paima Volcaneers"];
        const options = {
            gasPrice: utils.parseUnits("100", "gwei"),
            gasLimit: 5000000,
        };

        const Nft = await hre.ethers.getContractFactory("Nft");
        const nft = await Nft.attach(NFT_ADDRESS);

        if (taskArgs.minter) {
            console.log(`Setting minter to ${taskArgs.minter}...`);
            await (await nft.setMinter(taskArgs.minter, options)).wait(3);
            console.log("Minter updated...\n");
        }

        if (taskArgs.supply) {
            console.log(`Setting max supply to ${taskArgs.supply}...`);
            await (
                await nft.updateMaxSupply(
                    BigNumber.from(taskArgs.supply),
                    options
                )
            ).wait(3);
            console.log("Max supply updated...\n");
        }

        if (taskArgs.baseuri) {
            console.log(`Setting base URI to ${taskArgs.baseuri}...`);
            await (await nft.setBaseURI(taskArgs.baseuri, options)).wait(3);
            console.log("Base URI updated...\n");
        }
    });
