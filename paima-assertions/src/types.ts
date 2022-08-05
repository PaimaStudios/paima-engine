import type { ETHAddress } from "paima-utils";

export interface Processor {
    processInput: (input: string, userAddress: ETHAddress) => boolean
}

export interface Assertion {
    prefix: string,
    content: string
}