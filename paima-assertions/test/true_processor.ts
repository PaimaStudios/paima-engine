import type { ETHAddress } from "paima-utils";

class TrueProcessor {
    processInput(assertion: string, userAddress: ETHAddress): boolean {
        return true;
    }
}

export default TrueProcessor;