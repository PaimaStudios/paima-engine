import {
    getWeb3,
    getStorageContract,
    validateStorageAddress,
    doLog,
} from "paima-utils";

import type { ChainData, ChainDataExtension } from "paima-utils";

import { internalReadDataMulti, timeout } from "./reading.js";

import { verifySignatureCardano } from "./batch-processing.js";

const DEFAULT_BLOCK_COUNT = 100;

const paimaFunnel = {
    async initialize(nodeUrl: string, storageAddress: string) {
        validateStorageAddress(storageAddress);
        const web3 = await getWeb3(nodeUrl);
        const storage = getStorageContract(storageAddress, web3);
        return {
            nodeUrl,
            storageAddress,
            extensions: [] as ChainDataExtension[],
            web3,
            storage,
            async readData(
                blockHeight: number,
                blockCount: number = DEFAULT_BLOCK_COUNT
            ): Promise<ChainData[]> {
                let blocks: ChainData[] = [];
                try {
                    const latestBlock = await timeout(
                        web3.eth.getBlockNumber(),
                        3000
                    );
                    let fromBlock = blockHeight;
                    let toBlock = Math.min(
                        latestBlock,
                        fromBlock + blockCount - 1
                    );

                    if (toBlock >= fromBlock) {
                        doLog(
                            `[Paima Funnel] reading blocks from #${fromBlock} to #${toBlock}`
                        );
                        await internalReadDataMulti(
                            web3,
                            storage,
                            fromBlock,
                            toBlock
                        )
                            .then(res => (blocks = res))
                            .catch(err => {
                                console.log(err);
                                const errMsg = `Block reading failed`;
                                console.error(errMsg);
                            });
                    } else {
                        if (blockCount > 0) {
                            doLog(
                                `[PaimaFunnel] skipping reading, no new blocks ready`
                            );
                        }
                        blocks = [];
                    }
                } catch (err) {
                    console.log(err);
                    const errMsg = `Exception occurred while reading blocks`;
                    console.error(errMsg);
                    return [];
                }
                return blocks;
            },
        };
        /*},
    async cdTest() {
        const address = "00839d40dbd0ddfb730e685872a055576ad55ca456f0f179cecada6da9a250c8388530fb2f04f9f30fe2f34c9932eea849de8580b19d8e1b89";
        //const address = "addr_test1qzpe6sxm6rwlkucwdpv89gz42a4d2h9y2mc0z7wwetdxm2dz2ryr3pfslvhsf70npl30xnyexth2sjw7skqtr8vwrwys4jp58m";
        const message = "HLWSP how are you hello";
        const signature = "845869a301270458200d1ad3049a94cbf5d72aff14e5edb8c376c01f33f159cf4fca9b86d0699b11356761646472657373583900839d40dbd0ddfb730e685872a055576ad55ca456f0f179cecada6da9a250c8388530fb2f04f9f30fe2f34c9932eea849de8580b19d8e1b89a166686173686564f457484c57535020686f772061726520796f752068656c6c6f5840d0804e2c2ee65e1bc992e2dff9d63c97a81b4a6a4637d1b20ea2f581dc5d175869b234a326ccdc07cdafe01bf10042f53c10d69013c9bb0318fab9e0f506b702";
        
        try {
            console.log("[cdTest] verifying...");
            const result = await verifySignatureCardano(address, message, signature);
            console.log("Result:", result);
        } catch (err) {
            console.log("[cdTest] caught", err);
        }*/
    },
};

export default paimaFunnel;
