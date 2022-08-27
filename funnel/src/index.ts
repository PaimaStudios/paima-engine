import {
    getWeb3,
    getStorageContract,
    validateStorageAddress,
    doLog,
} from "paima-utils";

import type { ChainData, ChainDataExtension } from "paima-utils";

import { internalReadDataMulti, timeout } from "./reading.js";

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
                    const latestBlock = await timeout(web3.eth.getBlockNumber(), 3000);
                    const toBlock = Math.min(
                        latestBlock,
                        blockHeight + blockCount - 1
                    );

                    doLog(`[Paima Funnel] reading blocks from #${blockHeight} to #${toBlock}`)
                    await internalReadDataMulti(
                        web3,
                        storage,
                        blockHeight,
                        toBlock
                    )
                        .then(
                            res => (blocks = res)
                        )
                        .catch(err => {
                            console.log(err);
                            const errMsg = `Block reading failed`;
                            console.error(errMsg);
                        });

                } catch (err) {
                    console.log(err);
                    const errMsg = `Exception occurred while reading blocks`;
                    console.error(errMsg);
                    return [];
                }
                return blocks;
            },
        };
    },
};

export default paimaFunnel;

