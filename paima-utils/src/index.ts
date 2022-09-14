import Web3 from "web3";
import type { Contract } from "web3-eth-contract";
import type { AbiItem } from "web3-utils";
import pkg from 'web3-utils';
const { isAddress } = pkg;
import storageBuild from "./artifacts/Storage.js";
import type {
    ErrorCode,
    ErrorMessageFxn,
    ChainFunnel,
    ETHAddress,
    SQLUpdate,
    SubmittedChainData,
    ChainData,
    GameStateTransitionFunctionRouter,
    GameStateTransitionFunction,
    GameStateMachineInitializer,
    GameStateMachine,
    PaimaRuntimeInitializer,
    PaimaRuntime
} from "./types";
import {logBlock, logSuccess, logError, doLog} from "./logging.js";
export type { Web3 };

export interface ChainDataExtension {}

export type TransactionTemplate = {
    data: string;
    to: string;
};

export function buildErrorCodeTranslator(obj: any): ErrorMessageFxn {
    return function(errorCode: ErrorCode): string {
        if (!obj.hasOwnProperty(errorCode)) {
            return "Unknown error code: " + errorCode;
        } else {
            return obj[errorCode];
        }
    }
}

export async function getWeb3(nodeUrl: string): Promise<Web3> {
    const web3 = new Web3(nodeUrl);
    try {
        await web3.eth.getNodeInfo();
    } catch (e) {
        throw new Error(`Error connecting to node at ${nodeUrl}:\n${e}`);
    }
    return web3;
}

export function getStorageContract(address?: string, web3?: Web3): Contract {
    if (web3 === undefined) {
        web3 = new Web3();
    }
    return new web3.eth.Contract(storageBuild.abi as AbiItem[], address);
}

export function validateStorageAddress(address: string) {
    if (!isAddress(address)) {
        throw new Error("Invalid storage address supplied");
    }
}

export async function getFee(address: string, web3: Web3): Promise<string> {
    const contract = getStorageContract(address, web3);
    return contract.methods.fee().call();
}

export const wait = async (ms: number) => new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
});

export async function getOwner(address: string, web3: Web3): Promise<string> {
    const contract = getStorageContract(address, web3);
    return contract.methods.owner().call();
}

export async function retryPromise<T>(getPromise: () => Promise<T>, waitPeriodMs: number, tries: number): Promise<T> {
    let done = false;
    let result;
    let failure;

    if (tries <= 0) {
        throw new Error("Too few tries reserved for operation");
    }

    while (tries > 0) {
        await getPromise()
        .then((res) => {
            result = res;
            done = true;
        }).catch((err) => {
            failure = err;
            done = false;
        });

        tries--;

        if (done) {
            break;
        }

        await wait(waitPeriodMs);
    }

    if (typeof(result) === "undefined") {
        if (typeof(failure === "undefined")) {
            throw new Error("Unknown retry error: no retries left, undefined result");
        } else {
            throw failure;
        }
    } else {
        return result;
    }
}

export {
    ChainFunnel,
    ETHAddress,
    SQLUpdate,
    ErrorCode,
    ErrorMessageFxn,
    SubmittedChainData,
    ChainData,
    GameStateTransitionFunctionRouter,
    GameStateTransitionFunction,
    GameStateMachineInitializer,
    GameStateMachine,
    PaimaRuntimeInitializer,
    PaimaRuntime,
    logBlock,
    logSuccess,
    logError,
    doLog
}