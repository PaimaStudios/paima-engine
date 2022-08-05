import type { ETHAddress } from "paima-utils";

class FalseProcessor {
    processInput(assertion: string, userAddress: ETHAddress): boolean {
        return false;
    }
}

export default FalseProcessor;