import type { ETHAddress } from "paima-utils";

class NftProcessor {
    nftIndexerUrl: string;

    constructor(nftIndexerUrl: string) {
        this.nftIndexerUrl = nftIndexerUrl;
    }

    processInput(assertion: string, userAddress: ETHAddress): boolean {
        const parts = assertion.split("|");
        if (parts.length !== 2) {
            return false;
        }
        
        return true;
    }
}

export default NftProcessor