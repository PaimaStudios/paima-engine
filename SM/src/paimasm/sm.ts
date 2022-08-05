import pg from "pg";
import { getLatestBlockHeight, getRandomness, getScheduledDataByBlockHeight, saveLastBlockHeight, blockHeightDone } from "../sql/queries.queries.js";
import { GameStateMachineInitializer } from "paima-utils";
import Prando from "prando";
import Crypto from "crypto";



const SM: GameStateMachineInitializer = {
  initialize: (
    databaseInfo,
    randomnessProtocolEnum,
    gameStateTransitionRouter,
    startBlockheight
  ) => {
    const DBConn = new pg.Pool(databaseInfo);
    // const ensureReadOnly = `SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;`
    // const readonlyset = readonlyDBConn.query(ensureReadOnly);
    return {
      latestBlockHeight: async () => {
        const [b] = await getLatestBlockHeight.run(undefined, DBConn);
        const blockHeight = b?.block_height || startBlockheight || 0;
        return blockHeight;
      },
      process: async (latestChainData) => {
        const gameStateTransition = gameStateTransitionRouter(latestChainData.blockNumber);
        // Save blockHeight and randomness seed (which uses the blockHash)
        const hashes = await getRandomness.run(undefined, DBConn);
        const seed = hashTogether([latestChainData.blockHash, ...hashes.map(h => h.seed)]);
        await saveLastBlockHeight.run({ block_height: latestChainData.blockNumber, seed: seed }, DBConn);
        // generate randomness
        const randomnessGenerator = new Prando(seed);
        // fetch data scheduled for present block height and execute if exists
        const scheduledData = await getScheduledDataByBlockHeight.run({ block_height: latestChainData.blockNumber }, DBConn);
        for (let data of scheduledData) {
          const inputData = {
            userAddress: "0x0",
            inputData: data.input_data
          }
          const sqlQueries = await gameStateTransition(inputData, latestChainData.blockNumber, randomnessGenerator, DBConn);
          for (let [query, params] of sqlQueries) {
            try {
              await query.run(params, DBConn);
            } catch (error) {
              console.log(error, "database error")
            }
          }
        }
        // process actual user input
        for (let inputData of latestChainData.submittedData) {
          const sqlQueries = await gameStateTransition(inputData, latestChainData.blockNumber, randomnessGenerator, DBConn);
          for (let [query, params] of sqlQueries) {
            try {
              await query.run(params, DBConn);
            } catch (error) {
              console.log(error, "database error")
            }
          }
        }
        await blockHeightDone.run({ block_height: latestChainData.blockNumber }, DBConn);
      },
    };
  },
};

function hashTogether(hashes: string[]): string {
  return Crypto.createHash('sha256').update(hashes.join()).digest('base64');
}

export default SM;