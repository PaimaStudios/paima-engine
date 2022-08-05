import type { ChainData, SubmittedChainData, ETHAddress } from "paima-utils";
import NftProcessor from "./nft_processor.js";
import type { Assertion, Processor } from "./types.js";

function findAssertions(input: string, limit: number): Assertion[] | null {
    // assertions are of the form \|[a-z]+<[^>]>\| (with the final '|' possibly omitted at the end of the string)
    let found = 0;
    let frontDividerIndex = input.length; // The '|' before the assertion
    let backDividerIndex;                 // The '|' after the assertion (or end of string)
    let openerIndex;                      // The '<' in the assertion
    let result: Assertion[] = [];

    if (input[frontDividerIndex - 1] === "|") {
        frontDividerIndex--;
    }

    while (found < limit) {
        if (input[frontDividerIndex - 1] !== ">") {
            break;
        }
        backDividerIndex = frontDividerIndex;
        openerIndex = input.slice(0, backDividerIndex).lastIndexOf("<");
        if (openerIndex === -1) {
            return null;
        }
        frontDividerIndex = input.slice(0, openerIndex).lastIndexOf("|");
        if (frontDividerIndex === -1) {
            return null;
        }
        result.push({
            prefix: input.slice(frontDividerIndex + 1, openerIndex),
            content: input.slice(openerIndex + 1, backDividerIndex - 1)
        });
        found++;
    }
    // There should be no more assertions in the string at this stage:
    if (input.slice(0, frontDividerIndex).search(/<|>/) >= 0) {
        return null;
    }

    return result;
}

export const PaimaAssertions = {
    initialize(maxAssertionsPerInput: number) {
        return {
            maxAssertionsPerInput,

            processors: new Map<string, Processor>(),

            addNftProcessor(nftIndexerUrl: string) {
                if (this.processors.has("n")) {
                    throw new Error("NftProcessor already registered");
                }
                this.processors.set("n", new NftProcessor(nftIndexerUrl));
            },

            addAnyProcessor(processor: Processor, prefix: string) {
                if (this.processors.has(prefix)) {
                    throw new Error(`PaimaAssertions already has a processor registered for prefix ${prefix}`);
                }
                this.processors.set(prefix, processor);
            },

            validateAssertion(assertion: Assertion, userAddress: ETHAddress): boolean {
                const processor = this.processors.get(assertion.prefix);
                if (processor === undefined) {
                    return false;
                } else {
                    return processor.processInput(assertion.content, userAddress);
                }
            },

            validateSubmittedData(submittedData: SubmittedChainData) {
                const assertions = findAssertions(submittedData.inputData, maxAssertionsPerInput);
                if (assertions === null) {
                    return false;
                }
                return assertions.every((assertion) => {
                    return this.validateAssertion(assertion, submittedData.userAddress);
                });
            },

            processChainData(chainData: ChainData): ChainData {
                let validatedData: SubmittedChainData[] = [];
                chainData.submittedData.forEach((submittedData) => {
                    if (this.validateSubmittedData(submittedData)) {
                        validatedData.push(submittedData);
                    } else {
                    }
                })
                return {...chainData, submittedData: validatedData};
            }
        };
    }
}