import Web3 from "web3";
import type { Contract, EventData } from "web3-eth-contract";
import {
    getWeb3,
    getStorageContract,
    validateStorageAddress,
    SubmittedChainData,
} from "paima-utils";
import pkg from "web3-utils";
const { hexToUtf8 } = pkg;

import type { ChainData, ChainDataExtension } from "paima-utils";

interface PromiseFulfilledResult<T> {
    status: "fulfilled";
    value: T;
}

const DEFAULT_BLOCK_COUNT = 100;

async function processDataUnit(
    unit: SubmittedChainData
): Promise<SubmittedChainData[]> {
    if (unit.inputData.includes("~")) {
        return [];
    } else {
        return [unit];
    }
}

async function processBlock(
    blockNumber: number,
    web3: Web3,
    storage: Contract
): Promise<ChainData> {
    try {
        const [block, events] = await Promise.all([
            web3.eth.getBlock(blockNumber),
            storage.getPastEvents("PaimaGameInteraction", {
                fromBlock: blockNumber,
                toBlock: blockNumber,
            }),
        ]);
        return {
            timestamp: block.timestamp,
            blockHash: block.hash,
            blockNumber: block.number,
            submittedData: (
                await Promise.all(
                    events.map(function (e) {
                        return processDataUnit({
                            userAddress: e.returnValues.userAddress,
                            inputData: hexToUtf8(e.returnValues.data),
                        });
                    })
                )
            ).flat(),
        };
    } catch {
        return {
            timestamp: 0,
            blockHash: "",
            blockNumber: 0,
            submittedData: [],
        };
    }
}

async function eventToBlockData(
    web3: Web3,
    eventLog: EventData
): Promise<ChainData> {
    return web3.eth.getBlock(eventLog.blockNumber).then(block => ({
        timestamp: block.timestamp,
        blockHash: eventLog.blockHash,
        blockNumber: eventLog.blockNumber,
        submittedData: [
            {
                userAddress: eventLog.returnValues.userAddress,
                inputData: eventLog.returnValues.data,
            },
        ],
    }));
}

function compactifyDataList(data: ChainData[]): ChainData[] {
    let result = [];
    let workingBlock: ChainData = {
        timestamp: 0,
        blockHash: "",
        blockNumber: -1,
        submittedData: [],
    };

    data.forEach(eventBlock => {
        if (eventBlock.blockNumber > workingBlock.blockNumber) {
            if (workingBlock.blockNumber >= 0) {
                result.push(workingBlock);
            }
            workingBlock = eventBlock;
        } else {
            workingBlock.submittedData.push(eventBlock.submittedData[0]);
        }
    });
    if (data.length > 0) {
        result.push(workingBlock);
    }

    return result;
}

async function internalReadDataFast(
    web3: Web3,
    storage: Contract,
    fromBlock: number,
    toBlock: number
): Promise<ChainData[]> {
    const events = await storage.getPastEvents("PaimaGameInteraction", {
        fromBlock: fromBlock,
        toBlock: toBlock,
    });
    // NOTE: skips empty blocks, doesn't align with spec
    return Promise.all(events.map(event => eventToBlockData(web3, event))).then(
        compactifyDataList
    );
}

async function internalReadDataMulti(
    web3: Web3,
    storage: Contract,
    fromBlock: number,
    toBlock: number
): Promise<ChainData[]> {
    let blockPromises: Promise<ChainData>[] = [];
    for (let i = fromBlock; i <= toBlock; i++) {
        const block = processBlock(i, web3, storage);
        blockPromises.push(block);
    }
    return Promise.allSettled(blockPromises).then(resList => {
        let firstRejected = resList.findIndex(
            elem => elem.status === "rejected"
        );
        if (firstRejected < 0) {
            firstRejected = resList.length;
        }
        return resList
            .slice(0, firstRejected)
            .map(elem => (elem as PromiseFulfilledResult<ChainData>).value);
    });
}

async function internalReadDataSingle(
    web3: Web3,
    storage: Contract,
    fromBlock: number
): Promise<ChainData> {
    return processBlock(fromBlock, web3, storage);
}

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
                    const latestBlock = await web3.eth.getBlockNumber();
                    const toBlock = Math.min(
                        latestBlock,
                        blockHeight + blockCount - 1
                    );
                    await internalReadDataMulti(
                        web3,
                        storage,
                        blockHeight,
                        toBlock
                    )
                        .then(res => (blocks = res))
                        .catch(err => {
                            console.log(err);
                            const errMsg = `Block reading failed`;
                            console.error(errMsg);
                        });
                } catch (err) {
                    console.log(err);
                    const errMsg = `Exception occured while reading blocks`;
                    console.error(errMsg);
                    return [];
                }
                return blocks;
            },
        };
    },
};

export default paimaFunnel;
