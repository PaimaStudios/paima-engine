import type { Pool } from 'pg';

import { doLog, ENV, SCHEDULED_DATA_ADDRESS } from '@paima/utils';
import type {
  ChainData,
  PresyncChainData,
  SubmittedData,
  ChainDataExtensionDatum,
} from '@paima/runtime';
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
  markCdeDatumProcessed,
  markCdeBlockheightProcessed,
  getLatestProcessedCdeBlockheight,
} from '@paima/db';
import type { GameStateTransitionFunction, GameStateMachineInitializer } from '@paima/runtime';
import Prando from '@paima/prando';

import { randomnessRouter } from './randomness.js';
import { cdeTransitionFunction, getProcessedCdeDatumCount } from './cde-processing.js';
import { checkSecurityPrefix, stripSecuirtyPrefix } from '@paima/concise';

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
        const [b] = await getLatestProcessedCdeBlockheight.run(undefined, readonlyDBConn);
        const blockHeight = b?.block_height ?? 0;
        return blockHeight;
      },
      presyncStarted: async (): Promise<boolean> => {
        const res = await getLatestProcessedCdeBlockheight.run(undefined, readonlyDBConn);
        return res.length > 0;
      },
      syncStarted: async (): Promise<boolean> => {
        const res = await getLatestProcessedBlockHeight.run(undefined, readonlyDBConn);
        return res.length > 0;
      },
      initializeDatabase: async (force: boolean = false): Promise<boolean> => {
        return await initializePaimaTables(DBConn, force);
      },
      getReadonlyDbConn: (): Pool => {
        return readonlyDBConn;
      },
      getReadWriteDbConn: (): Pool => {
        return getConnection(databaseInfo);
      },
      presyncProcess: async (latestCdeData: PresyncChainData): Promise<void> => {
        const cdeDataLength = await processCdeData(
          latestCdeData.blockNumber,
          latestCdeData.extensionDatums,
          readonlyDBConn,
          DBConn
        );
        if (cdeDataLength > 0) {
          doLog(`Processed ${cdeDataLength} CDE events in block #${latestCdeData.blockNumber}`);
        }
      },
      markPresyncMilestone: async (blockHeight: number): Promise<void> => {
        await markCdeBlockheightProcessed.run({ block_height: blockHeight }, DBConn);
      },
      dryRun: async (gameInput: string, userAddress: string): Promise<boolean> => {
        const [b] = await getLatestProcessedBlockHeight.run(undefined, readonlyDBConn);
        const blockHeight = b?.block_height ?? startBlockHeight ?? 0;
        const gameStateTransition = gameStateTransitionRouter(blockHeight);
        const data = await gameStateTransition(
          {
            userAddress: userAddress,
            inputData: gameInput,
            inputNonce: '',
            suppliedValue: '0',
            scheduled: false,
            dryRun: true,
          },
          blockHeight,
          new Prando('1234567890'),
          readonlyDBConn
        );
        return data && data.length > 0;
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
          readonlyDBConn,
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
  readonlyDBConn: Pool,
  DBConn: Pool
): Promise<number> {
  if (!cdeData) {
    return 0;
  }

  let processedCdeDatumCount = await getProcessedCdeDatumCount(readonlyDBConn, blockHeight);
  if (processedCdeDatumCount > 0) {
    cdeData = cdeData.slice(processedCdeDatumCount);
  }

  for (const datum of cdeData) {
    const sqlQueries = await cdeTransitionFunction(readonlyDBConn, datum);
    try {
      processedCdeDatumCount++;
      const datumCount = processedCdeDatumCount;
      await tx<void>(DBConn, async db => {
        for (const [query, params] of sqlQueries) {
          await query.run(params, db);
        }
        await markCdeDatumProcessed.run(
          {
            block_height: blockHeight,
            datum_count: datumCount,
          },
          db
        );
      });
    } catch (err) {
      doLog(`[paima-sm] Database error: ${err}`);
    }
  }

  try {
    await markCdeBlockheightProcessed.run({ block_height: blockHeight }, DBConn);
  } catch (err) {
    doLog(`[paima-sm] Database error: ${err}`);
    return 0;
  }
  return cdeData.length;
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
      // security prefix is optional in scheduled data.
      inputData: stripSecuirtyPrefix(data.input_data),
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
    if (!checkSecurityPrefix(inputData.inputData)) {
      doLog(`Skipping inputData with invalid security prefix: ${inputData}`);
      continue;
    }

    // Trigger STF
    const sqlQueries = await gameStateTransition(
      {
        ...inputData,
        inputData: stripSecuirtyPrefix(inputData.inputData),
      },
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
