import fs from "fs";
import path from "path";
import NativeNftSale from "../artifacts/src/NativeNftSale.sol/NativeNftSale.json";
import NftSale from "../artifacts/src/NftSale.sol/NftSale.json";

import Nft from "../artifacts/src/Nft.sol/Nft.json";
import NativeProxy from "../artifacts/src/Proxy/NativeProxy.sol/NativeProxy.json";
import Proxy from "../artifacts/src/Proxy/Proxy.sol/Proxy.json";

const writeToFile = (fileName: string, abi: any) => {
    const dir_name = "abis";

    fs.writeFileSync(
        path.join(__dirname, `../${dir_name}/${fileName}.json`),
        JSON.stringify(abi, null, "    ")
    );
};

(async () => {
    console.log("Generating ABIs...");

    const nftAbi = Nft.abi;
    writeToFile("Nft", nftAbi);

    const nativeNftSaleAbi = NativeNftSale.abi;
    writeToFile("NativeNftSale", nativeNftSaleAbi);

    const nftSaleAbi = NftSale.abi;
    writeToFile("NftSale", nftSaleAbi);

    const nativeProxyAbi = NativeProxy.abi;
    writeToFile("NativeProxy", nativeProxyAbi);

    const proxyAbi = Proxy.abi;
    writeToFile("Proxy", proxyAbi);

    console.log("ABIs generated :)");
})();
