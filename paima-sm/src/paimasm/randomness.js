import Crypto from "crypto";
import { getRandomness } from "../sql/queries.queries.js";
export function randomnessRouter(n) {
    if (n)
        return getSeed1;
    else
        throw Error("wrong randomness protocol set");
}
// Basic randomness generation protocol which hashes together previous seeds + latest block hash
async function getSeed1(latestChainData, DBConn) {
    const hashes = await getRandomness.run(undefined, DBConn);
    const seed = hashTogether([latestChainData.blockHash, ...hashes.map(h => h.seed)]);
    return seed;
}
function hashTogether(hashes) {
    return Crypto.createHash('sha256').update(hashes.join()).digest('base64');
}
