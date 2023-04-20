import { utils } from "ethers";
import { task } from "hardhat/config";
import Addresses from "../contract-addresses.json";

task("transfer-ownership")
    .addParam("owner", "new owner")
    .setAction(async (taskArgs, hre) => {
        const signers = await hre.ethers.getSigners();
        const networkName = hre.network.name;

        const owner = await (await hre.ethers.getSigners())[0].getAddress();

        const NFT_ADDRESS = Addresses[networkName]["Paima Volcaneers"];
        const options = {
            gasPrice: utils.parseUnits("100", "gwei"),
            gasLimit: 5000000,
        };

        const Nft = await hre.ethers.getContractFactory("Nft");
        const nft = await Nft.attach(NFT_ADDRESS);

        // transfer ownership of NFT contract
        console.log(
            `Transferring ownership of NFT contract from ${owner} to ${taskArgs.owner}`
        );

        await (await nft.transferOwnership(taskArgs.owner, options)).wait(3);
        const newNftOwner = await nft.owner();

        console.log(`Nft owner successfully transferred to ${newNftOwner}`);

        const NATIVE_NFTSALE_PROXY_ADDRESS =
            Addresses[networkName]["NativeNftSale_Proxy"];

        const NftSale = await hre.ethers.getContractFactory("NftSale");
        const nativeNftSaleProxy = await NftSale.attach(
            NATIVE_NFTSALE_PROXY_ADDRESS
        );

        // transfer ownership of Nftsale Proxy contract
        console.log(
            `Transferring ownership of NftSale Proxy contract from ${owner} to ${taskArgs.owner}`
        );

        await (
            await nativeNftSaleProxy.transferOwnership(taskArgs.owner, options)
        ).wait(3);

        const newNativeNftSaleOwner = await nativeNftSaleProxy.owner();
        console.log(
            `NftSale owner successfully transferred to ${newNativeNftSaleOwner}`
        );
    });
