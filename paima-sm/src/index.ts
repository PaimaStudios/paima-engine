import type { Pool } from 'pg';

import { doLog, ENV, SCHEDULED_DATA_ADDRESS } from '@paima/utils';
import type { ChainData, SubmittedData, ChainDataExtensionDatum } from '@paima/utils';
import {
  tx,
  getConnection,
  initializePaimaTables,
  storeGameInput,
  blockHeightDone,
  deleteScheduled,
  findNonce,
  insertNonce,
  getLatestProcessedBlockHeight,
  getScheduledDataByBlockHeight,
  saveLastBlockHeight,
  markPresyncBlockheightTouched,
  markPresyncBlockheightProcessed,
  getLatestProcessedPresyncBlockheight,
} from '@paima/db';
import type { GameStateTransitionFunction, GameStateMachineInitializer } from '@paima/db';
import Prando from '@paima/prando';

import { randomnessRouter } from './randomness.js';
import { processCdeDatum } from './cde-processing.js';

const SM: GameStateMachineInitializer = {
  initialize: (
    databaseInfo,
    randomnessProtocolEnum,
    gameStateTransitionRouter,
    startBlockHeight
  ) => {
    const DBConn: Pool = getConnection(databaseInfo);
    const readonlyDBConn: Pool = getConnection(databaseInfo, true);

    return {
      latestProcessedBlockHeight: async (): Promise<number> => {
        const [b] = await getLatestProcessedBlockHeight.run(undefined, readonlyDBConn);
        const blockHeight = b?.block_height ?? startBlockHeight ?? 0;
        return blockHeight;
      },
      getPresyncBlockHeight: async (): Promise<number> => {
        const [b] = await getLatestProcessedPresyncBlockheight.run(undefined, readonlyDBConn);
        const blockHeight = b?.block_height ?? 0;
        return blockHeight;
      },
      initializeDatabase: async (force: boolean = false): Promise<boolean> => {
        return await initializePaimaTables(DBConn, force);
      },
      getReadonlyDbConn: (): Pool => {
        return readonlyDBConn;
      },
      getNewReadWriteDbConn: (): Pool => {
        return getConnection(databaseInfo);
      },
      presyncProcess: async (latestCdeData: ChainDataExtensionDatum[]): Promise<void> => {
        if (latestCdeData.length === 0) {
          return;
        }
        const blockHeight = latestCdeData[0].blockNumber;
        await markPresyncBlockheightTouched.run({ block_height: blockHeight }, DBConn);
        try {
          await tx<void>(DBConn, async db => {
            for (const datum of latestCdeData) {
              if (datum.blockNumber !== blockHeight) {
                doLog('[paima-sm] CDE data out of order detected!');
              }
              await processCdeDatum(DBConn, datum);
            }
            await markPresyncBlockheightProcessed.run({ block_height: blockHeight }, DBConn);
          });
        } catch (err) {
          doLog(`[paima-sm] Database error: ${err}`);
        }
      },
      markPresyncMilestone: async (blockHeight: number): Promise<void> => {
        await markPresyncBlockheightProcessed.run({ block_height: blockHeight }, DBConn);
      },
      // Core function which triggers state transitions
      process: async (latestChainData: ChainData): Promise<void> => {
        // Acquire correct STF based on router (based on block height)
        const gameStateTransition = gameStateTransitionRouter(latestChainData.blockNumber);
        // Save blockHeight and randomness seed
        const getSeed = randomnessRouter(randomnessProtocolEnum);
        const seed = await getSeed(latestChainData, readonlyDBConn);
        await saveLastBlockHeight.run(
          { block_height: latestChainData.blockNumber, seed: seed },
          DBConn
        );
        // Generate Prando object
        const randomnessGenerator = new Prando(seed);

        const cdeDataLength = await processCdeData(
          latestChainData.blockNumber,
          latestChainData.extensionDatums,
          DBConn
        );

        // Fetch and execute scheduled input data
        const scheduledInputsLength = await processScheduledData(
          latestChainData,
          readonlyDBConn,
          DBConn,
          gameStateTransition,
          randomnessGenerator
        );

        // Execute user submitted input data
        const userInputsLength = await processUserInputs(
          latestChainData,
          readonlyDBConn,
          DBConn,
          gameStateTransition,
          randomnessGenerator
        );

        // Extra logging
        if (cdeDataLength + userInputsLength + scheduledInputsLength > 0)
          doLog(
            `Processed ${userInputsLength} user inputs, ${scheduledInputsLength} scheduled inputs and ${cdeDataLength} CDE events in block #${latestChainData.blockNumber}`
          );
        // Commit finishing of processing to DB
        await blockHeightDone.run({ block_height: latestChainData.blockNumber }, DBConn);
      },
    };
  },
};

async function processCdeData(
  blockHeight: number,
  cdeData: ChainDataExtensionDatum[] | undefined,
  DBConn: Pool
): Promise<number> {
  if (!cdeData) {
    return 0;
  }
  let count = 0;
  try {
    await tx<void>(DBConn, async db => {
      for (const datum of cdeData) {
        if (datum.blockNumber !== blockHeight) {
          doLog('[paima-sm] CDE data out of order detected!');
        }
        if (await processCdeDatum(DBConn, datum)) {
          count++;
        }
      }
      await markPresyncBlockheightProcessed.run({ block_height: blockHeight }, DBConn);
    });
  } catch (err) {
    doLog(`[paima-sm] Database error: ${err}`);
    return 0;
  }
  return count;
}

// Process all of the scheduled data inputs by running each of them through the game STF,
// saving the results to the DB, and deleting the schedule data all together in one postgres tx.
// Function returns number of scheduled inputs that were processed.
async function processScheduledData(
  latestChainData: ChainData,
  readonlyDBConn: Pool,
  DBConn: Pool,
  gameStateTransition: GameStateTransitionFunction,
  randomnessGenerator: Prando
): Promise<number> {
  const scheduledData = await getScheduledDataByBlockHeight.run(
    { block_height: latestChainData.blockNumber },
    readonlyDBConn
  );
  for (const data of scheduledData) {
    const inputData: SubmittedData = {
      userAddress: SCHEDULED_DATA_ADDRESS,
      inputData: data.input_data,
      inputNonce: '',
      suppliedValue: '0',
      scheduled: true,
    };
    // Trigger STF
    const sqlQueries = await gameStateTransition(
      inputData,
      data.block_height,
      randomnessGenerator,
      readonlyDBConn
    );
    try {
      await tx<void>(DBConn, async db => {
        for (const [query, params] of sqlQueries) {
          await query.run(params, db);
        }
        await deleteScheduled.run({ id: data.id }, db);
      });
    } catch (err) {
      doLog(`[paima-sm] Database error: ${err}`);
    }
  }
  return scheduledData.length;
}

// Process all of the user inputs data inputs by running each of them through the game STF,
// saving the results to the DB with the nonces, all together in one postgres tx.
// Function returns number of user inputs that were processed.
async function processUserInputs(
  latestChainData: ChainData,
  readonlyDBConn: Pool,
  DBConn: Pool,
  gameStateTransition: GameStateTransitionFunction,
  randomnessGenerator: Prando
): Promise<number> {
  for (const inputData of latestChainData.submittedData) {
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
    try {
      await tx<void>(DBConn, async db => {
        for (const [query, params] of sqlQueries) {
          await query.run(params, db);
        }
        await insertNonce.run(
          {
            nonce: inputData.inputNonce,
            block_height: latestChainData.blockNumber,
          },
          db
        );
        if (ENV.STORE_HISTORICAL_GAME_INPUTS) {
          await storeGameInput.run(
            {
              block_height: latestChainData.blockNumber,
              input_data: inputData.inputData,
              user_address: inputData.userAddress,
            },
            db
          );
        }
      });
    } catch (err) {
      doLog(`[paima-sm] Database error: ${err}`);
    }
  }
  return latestChainData.submittedData.length;
}

export default SM;
