import pg from 'pg';

import { GameStateMachineInitializer, doLog } from '@paima/utils';
import Prando from '@paima/prando';

import {
  blockHeightDone,
  deleteScheduled,
  findNonce,
  insertNonce,
  getLatestBlockHeight,
  getScheduledDataByBlockHeight,
  saveLastBlockHeight,
} from './sql/queries.queries.js';
import { randomnessRouter } from './randomness.js';

const SM: GameStateMachineInitializer = {
  initialize: (
    databaseInfo,
    randomnessProtocolEnum,
    gameStateTransitionRouter,
    startBlockHeight
  ) => {
    const DBConn = new pg.Pool(databaseInfo);
    const readonlyDBConn = new pg.Pool(databaseInfo);
    const ensureReadOnly = `SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;`;
    const readonlyset = readonlyDBConn.query(ensureReadOnly);
    return {
      latestBlockHeight: async () => {
        const [b] = await getLatestBlockHeight.run(undefined, readonlyDBConn);
        const blockHeight = b?.block_height ?? startBlockHeight ?? 0;
        return blockHeight;
      },
      // Core function which triggers state transitions
      process: async latestChainData => {
        // Acquire correct STF based on router (based on block height)
        const gameStateTransition = gameStateTransitionRouter(latestChainData.blockNumber);
        // Save blockHeight and randomness seed (which uses the blockHash)
        const getSeed = randomnessRouter(randomnessProtocolEnum);
        const seed = await getSeed(latestChainData, readonlyDBConn);
        await saveLastBlockHeight.run(
          { block_height: latestChainData.blockNumber, seed: seed },
          DBConn
        );
        // Generate Prando object
        const randomnessGenerator = new Prando(seed);

        // Fetch and execute scheduled input data
        const scheduledData = await getScheduledDataByBlockHeight.run(
          { block_height: latestChainData.blockNumber },
          readonlyDBConn
        );
        for (let data of scheduledData) {
          const inputData = {
            userAddress: '0x0',
            inputData: data.input_data,
            inputNonce: '',
          };
          // Trigger STF
          const sqlQueries = await gameStateTransition(
            inputData,
            latestChainData.blockNumber,
            randomnessGenerator,
            readonlyDBConn
          );
          for (let [query, params] of sqlQueries) {
            try {
              await query.run(params, DBConn);
            } catch (error) {
              doLog(`Database error: ${error}`);
            }
          }
          await deleteScheduled.run({ id: data.id }, DBConn);
        }

        // Execute user submitted input data
        for (let inputData of latestChainData.submittedData) {
          // Check nonce is valid
          if (inputData.inputNonce === '') {
            doLog(`Skipping inputData with invalid empty nonce: ${inputData}`);
            continue;
          }
          const nonceData = await findNonce.run({ nonce: inputData.inputNonce }, readonlyDBConn);
          if (nonceData.length > 0) {
            doLog(`Skipping inputData with duplicate nonce: ${inputData}`);
            continue;
          }

          // Trigger STF
          const sqlQueries = await gameStateTransition(
            inputData,
            latestChainData.blockNumber,
            randomnessGenerator,
            readonlyDBConn
          );
          for (let [query, params] of sqlQueries) {
            try {
              await query.run(params, DBConn);
            } catch (error) {
              doLog(`Database error: ${error}`);
            }
          }
          await insertNonce.run(
            {
              nonce: inputData.inputNonce,
              block_height: latestChainData.blockNumber,
            },
            DBConn
          );
        }
        await blockHeightDone.run({ block_height: latestChainData.blockNumber }, DBConn);
      },
    };
  },
};

export default SM;
