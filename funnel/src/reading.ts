import Web3 from "web3";
import type { Contract } from "web3-eth-contract";
import pkg from "web3-utils";
const { hexToUtf8 } = pkg;

import type { ChainData } from "paima-utils";

import { processDataUnit } from "./batch-processing.js";

interface PromiseFulfilledResult<T> {
    status: "fulfilled";
    value: T;
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
        console.log(
            "[funnel::processBlock] events",
            events,
            "at block height",
            block.number
        );
        return {
            timestamp: block.timestamp,
            blockHash: block.hash,
            blockNumber: block.number,
            submittedData: (
                await Promise.all(
                    events.map(function (e) {
                        const decodedData =
                            e.returnValues.data &&
                            e.returnValues.data.length > 0
                                ? hexToUtf8(e.returnValues.data)
                                : "";
                        return processDataUnit(
                            web3,
                            {
                                userAddress: e.returnValues.userAddress,
                                inputData: decodedData,
                                inputNonce: "",
                            },
                            block.number
                        );
                    })
                )
            ).flat(),
        };
    } catch (err) {
        console.log("[funnel::processBlock] caught", err);
        return {
            timestamp: 0,
            blockHash: "",
            blockNumber: 0,
            submittedData: [],
        };
    }
}

export async function internalReadDataMulti(
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

export async function internalReadDataSingle(
    web3: Web3,
    storage: Contract,
    fromBlock: number
): Promise<ChainData> {
    return processBlock(fromBlock, web3, storage);
}
