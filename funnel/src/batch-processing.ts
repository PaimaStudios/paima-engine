import {
    SubmittedChainData
} from "paima-utils";

interface ValidatedSubmittedChainData extends SubmittedChainData {
    validated: boolean;
}

async function validateSubunit(userAddress: string, userSignature: string, inputData: string): Promise<boolean> {
    // TODO: validate
    
    return false;
}

async function processBatchedSubunit(
    input: string
): Promise<ValidatedSubmittedChainData> {
    const INNER_DIVIDER = "/";
    const INVALID_INPUT: ValidatedSubmittedChainData = {
        inputData: "",
        userAddress: "",
        validated: false,
    };

    const elems = input.split(INNER_DIVIDER);
    if (elems.length !== 3) {
        return INVALID_INPUT;
    }

    const [userAddress, userSignature, inputData] = elems;
    const validated = await validateSubunit(userAddress, userSignature, inputData);

    return {
        inputData,
        userAddress,
        validated
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
    unit: SubmittedChainData
): Promise<SubmittedChainData[]> {
    const OUTER_DIVIDER = "~";

    if (!unit.inputData.includes(OUTER_DIVIDER)) {
        return [unit];
    }

    const hasClosingTilde =
        unit.inputData[unit.inputData.length - 1] === OUTER_DIVIDER;
    const elems = unit.inputData.split(OUTER_DIVIDER);
    const lastIndex = elems.length - (hasClosingTilde ? 2 : 1);

    const prefix = elems[0];

    if (prefix === "B") {
        const validatedSubUnits = await Promise.all(
            elems.slice(1, lastIndex).map(processBatchedSubunit)
        );
        return validatedSubUnits
            .filter(item => item.validated)
            .map(unpackValidatedData);
    } else {
        // Encountered unknown type of ~-separated input
        return [];
    }
}