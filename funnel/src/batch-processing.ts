import Web3 from "web3";
import { SubmittedChainData } from "paima-utils";

interface ValidatedSubmittedChainData extends SubmittedChainData {
    validated: boolean;
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
        validated: false,
    };

    console.log("Processing subunit:", input);

    const elems = input.split(INNER_DIVIDER);
    if (elems.length !== 4) {
        return INVALID_INPUT;
    }

    const [userAddress, userSignature, inputData, inputNonce] = elems;
    const validated = await validateSubunit(
        web3,
        userAddress,
        userSignature,
        inputData,
        inputNonce
    );

    console.log("Result:", validated);

    return {
        inputData,
        userAddress,
        validated,
    };
}

function unpackValidatedData(
    validated: ValidatedSubmittedChainData
): SubmittedChainData {
    return {
        inputData: validated.inputData,
        userAddress: validated.userAddress,
    };
}

export async function processDataUnit(
    web3: Web3,
    unit: SubmittedChainData
): Promise<SubmittedChainData[]> {
    const OUTER_DIVIDER = "~";
    console.log("[funnel::processDataUnit] unit:", unit);

    if (!unit.inputData.includes(OUTER_DIVIDER)) {
        return [unit];
    }

    const hasClosingTilde =
        unit.inputData[unit.inputData.length - 1] === OUTER_DIVIDER;
    const elems = unit.inputData.split(OUTER_DIVIDER);
    const afterLastIndex = elems.length - (hasClosingTilde ? 1 : 0);

    const prefix = elems[0];

    console.log("[funnel::processDataUnit] elems:", elems);

    if (prefix === "B") {
        const validatedSubUnits = await Promise.all(
            elems
                .slice(1, afterLastIndex)
                .map(elem => processBatchedSubunit(web3, elem))
        );
        console.log(
            "[funnel::processDataUnit] validated subunits:",
            validatedSubUnits
        );
        return validatedSubUnits
            .filter(item => item.validated)
            .map(unpackValidatedData);
    } else {
        // Encountered unknown type of ~-separated input
        return [];
    }
}
