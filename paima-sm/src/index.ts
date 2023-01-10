import pg from 'pg';

import { doLog, logError, SCHEDULED_DATA_ADDRESS } from '@paima/utils';
import type { SubmittedChainData } from '@paima/utils';
import type { ChainData, GameStateMachineInitializer } from '@paima/utils';
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
import type { ExecutionModeEnum } from '@paima/utils/src/types.js';

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const readonlyset = readonlyDBConn.query(ensureReadOnly); // note: this query modifies the DB state

    DBConn.on('error', err => logError(err));

    DBConn.on('connect', (_client: pg.PoolClient) => {
      // On each new client initiated, need to register for error(this is a serious bug on pg, the client throw errors although it should not)
      _client.on('error', (err: Error) => {
        logError(err);
      });
    });

    readonlyDBConn.on('error', err => logError(err));

    readonlyDBConn.on('connect', (_client: pg.PoolClient) => {
      // On each new client initiated, need to register for error(this is a serious bug on pg, the client throw errors although it should not)
      _client.on('error', (err: Error) => {
        logError(err);
      });
    });

    return {
      latestBlockHeight: async (): Promise<number> => {
        const [b] = await getLatestBlockHeight.run(undefined, readonlyDBConn);
        const blockHeight = b?.block_height ?? startBlockHeight ?? 0;
        return blockHeight;
      },
      getReadonlyDbConn: (): pg.Pool => {
        return readonlyDBConn;
      },
      // Core function which triggers state transitions
      process: async (
        latestChainData: ChainData,
        executionMode: ExecutionModeEnum
      ): Promise<void> => {
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

        let gameSTPromises = [];
        console.log('scheduledData: ', scheduledData.length);

        for (const data of scheduledData) {
          const inputData: SubmittedChainData = {
            userAddress: SCHEDULED_DATA_ADDRESS,
            inputData: data.input_data,
            inputNonce: '',
            suppliedValue: '0',
          };
          // // Trigger STF
          // const sqlQueries = await gameStateTransition(
          //   executionMode,
          //   inputData,
          //   data.block_height,
          //   randomnessGenerator,
          //   readonlyDBConn
          // );
          // for (const [query, params] of sqlQueries) {
          //   try {
          //     await query.run(params, DBConn);
          //   } catch (error) {
          //     doLog(`Database error: ${error}`);
          //   }
          // }
          // await deleteScheduled.run({ id: data.id }, DBConn);

          // Trigger STF Async
          const promise = gameStateTransition(
            executionMode,
            inputData,
            data.block_height,
            randomnessGenerator,
            readonlyDBConn
          )
            .then(async sqlQueries => {
              for (const [query, params] of sqlQueries) {
                try {
                  await query.run(params, DBConn);
                } catch (error) {
                  doLog(`Database error: ${error}`);
                }
              }
              return true;
            })
            .then(async _ => {
              await deleteScheduled.run({ id: data.id }, DBConn);
              return;
            });
          gameSTPromises.push(promise);
        }

        // print the number of promises but not the promises themselves
        // use three lines and console.log to avoid prettier formatting
        // print a logo to make it easier to find in the logs
        if (gameSTPromises.length > 1) {
          console.log('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀');
          console.log('gameSTPromises: ');
          console.log(gameSTPromises.length);
        }
        await Promise.all(gameSTPromises);

        // Execute user submitted input data
        gameSTPromises = [];
        for (const inputData of latestChainData.submittedData) {
          // Check nonce is valid
          if (inputData.inputNonce === '') {
            doLog(`Skipping inputData with invalid empty nonce: ${inputData}`);
            continue;
          }
          // const nonceData = await findNonce.run({ nonce: inputData.inputNonce }, readonlyDBConn);
          // if (nonceData.length > 0) {
          //   doLog(`Skipping inputData with duplicate nonce: ${inputData}`);
          //   continue;
          // }
          //
          // // Trigger STF
          // const sqlQueries = await gameStateTransition(
          //   executionMode,
          //   inputData,
          //   latestChainData.blockNumber,
          //   randomnessGenerator,
          //   readonlyDBConn
          // );
          // for (const [query, params] of sqlQueries) {
          //   try {
          //     await query.run(params, DBConn);
          //   } catch (error) {
          //     doLog(`Database error: ${error}`);
          //   }
          // }
          // await insertNonce.run(
          //   {
          //     nonce: inputData.inputNonce,
          //     block_height: latestChainData.blockNumber,
          //   },
          //   DBConn
          // );
          // Async
          const nonceData = findNonce.run({ nonce: inputData.inputNonce }, readonlyDBConn);

          const promise = nonceData
            .then(nonceData => {
              if (nonceData.length > 0) {
                throw new Error('Duplicate nonce');
              }
              return gameStateTransition(
                executionMode,
                inputData,
                latestChainData.blockNumber,
                randomnessGenerator,
                readonlyDBConn
              );
            })
            .then(async sqlQueries => {
              for (const [query, params] of sqlQueries) {
                try {
                  await query.run(params, DBConn);
                } catch (error) {
                  doLog(`Database error: ${error}`);
                }
              }
              return true;
            })
            .then(async _ => {
              await insertNonce.run(
                {
                  nonce: inputData.inputNonce,
                  block_height: latestChainData.blockNumber,
                },
                DBConn
              );
              return true;
            })
            .catch(error => {
              if (error.message !== 'Duplicate nonce') {
                doLog(`Skipping inputData with duplicate nonce: ${inputData}`);
              }
            });
          gameSTPromises.push(promise);
        }
        if (gameSTPromises.length > 1) {
          console.log('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀');
          console.log('gameSTPromises: ');
          console.log(gameSTPromises.length);
        }
        await Promise.all(gameSTPromises);
        await blockHeightDone.run({ block_height: latestChainData.blockNumber }, DBConn);
      },
    };
  },
};

export default SM;
