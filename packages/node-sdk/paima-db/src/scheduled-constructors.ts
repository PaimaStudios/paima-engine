import type { SQLUpdate } from './types.js';
import {
  newScheduledData,
  removeAllScheduledDataByInputData,
  removeScheduledData,
} from './sql/scheduled.queries.js';
import type {
  INewScheduledDataParams,
  IRemoveScheduledDataParams,
  IRemoveAllScheduledDataByInputDataParams,
} from './sql/scheduled.queries.js';

/**
 * Create an SQL update which schedules a piece of data to be run through
 * the STF at a future block height.
 *
 * @param inputData The input to pass to the STF, generally in Paima Concise format.
 * @param blockHeight The future block height at which to post the input to the STF.
 * @param txHash Transaction hash of the Primitive event that triggered this input, for possible later use.
 * @param cdeName Name of the CDE that triggered this input.
 * @returns
 */
export function createScheduledData(
  inputData: string,
  blockHeight: number,
  source: { cdeName: string; txHash: string; network: string } | { precompile: string }
): SQLUpdate {
  const nsdParams: INewScheduledDataParams = {
    block_height: blockHeight,
    input_data: inputData,
    tx_hash: 'txHash' in source ? source.txHash : null,
    cde_name: 'cdeName' in source ? source.cdeName : null,
    network: 'network' in source ? source.network : null,
    precompile: 'precompile' in source ? source.precompile : null,
  };
  const newScheduledDataTuple: SQLUpdate = [newScheduledData, nsdParams];
  return newScheduledDataTuple;
}

// Create an SQL update which deletes an upcoming scheduled data
// NOTE: if blockHeight is null, then delete ALL schedules that match inputData.
export function deleteScheduledData(inputData: string, blockHeight: number | null): SQLUpdate {
  if (blockHeight === null) {
    const dsdParams: IRemoveAllScheduledDataByInputDataParams = {
      input_data: inputData,
    };
    return [removeAllScheduledDataByInputData, dsdParams];
  }

  // Delete exact schedule by command and height
  const dsdParams: IRemoveScheduledDataParams = {
    block_height: blockHeight,
    input_data: inputData,
  };
  return [removeScheduledData, dsdParams];
}
