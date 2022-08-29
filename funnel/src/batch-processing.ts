import Web3 from "web3";
import { doLog, SubmittedChainData } from "paima-utils";

interface ValidatedSubmittedChainData extends SubmittedChainData {
    validated: boolean;
}

function unpackValidatedData(
    validatedData: ValidatedSubmittedChainData
): SubmittedChainData {
    const o = validatedData as any;
    delete o.validated;
    return o as SubmittedChainData;
}

function createNonce(web3: Web3, nonceInput: string): string {
    let nonce = web3.utils.sha3(nonceInput);
    if (nonce === null) {
        doLog(`[funnel] WARNING: failure generating nonce from: ${nonceInput}`);
        nonce = "";
    }
    return nonce;
}

async function validateSubunit(
    web3: Web3,
    userAddress: string,
    userSignature: string,
    inputData: string,
    inputNonce: string
): Promise<boolean> {
    const msg: string = inputData + inputNonce;
    const recoveredAddr = web3.eth.accounts.recover(msg, userSignature);
    return recoveredAddr.toLowerCase() === userAddress.toLowerCase();
}

async function processBatchedSubunit(
    web3: Web3,
    input: string
): Promise<ValidatedSubmittedChainData> {
    const INNER_DIVIDER = "/";
    const INVALID_INPUT: ValidatedSubmittedChainData = {
        inputData: "",
        userAddress: "",
        inputNonce: "",
        validated: false,
    };

    const elems = input.split(INNER_DIVIDER);
    if (elems.length !== 4) {
        return INVALID_INPUT;
    }

    const [userAddress, userSignature, inputData, millisecondTimestamp] = elems;
    const validated = await validateSubunit(
        web3,
        userAddress,
        userSignature,
        inputData,
        millisecondTimestamp
    );

    const hashInput = millisecondTimestamp + userAddress + inputData;
    const inputNonce = createNonce(web3, hashInput);

    return {
        inputData,
        userAddress,
        inputNonce,
        validated,
    };
}

export async function processDataUnit(
    web3: Web3,
    unit: SubmittedChainData,
    blockHeight: number
): Promise<SubmittedChainData[]> {
    const OUTER_DIVIDER = "~";

    if (!unit.inputData.includes(OUTER_DIVIDER)) {
        // Directly submitted input, prepare nonce and return:
        const hashInput =
            blockHeight.toString(10) + unit.userAddress + unit.inputData;
        const inputNonce = createNonce(web3, hashInput);
        return [
            {
                ...unit,
                inputNonce,
            },
        ];
    }

    const hasClosingTilde =
        unit.inputData[unit.inputData.length - 1] === OUTER_DIVIDER;
    const elems = unit.inputData.split(OUTER_DIVIDER);
    const afterLastIndex = elems.length - (hasClosingTilde ? 1 : 0);

    const prefix = elems[0];

    if (prefix === "B") {
        const validatedSubUnits = await Promise.all(
            elems
                .slice(1, afterLastIndex)
                .map(elem => processBatchedSubunit(web3, elem))
        );
        return validatedSubUnits
            .filter(item => item.validated)
            .map(unpackValidatedData);
    } else {
        // Encountered unknown type of ~-separated input
        return [];
    }
}
