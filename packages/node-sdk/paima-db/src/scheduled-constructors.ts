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

// Create an SQL update which schedules a piece of data to be run through
// the STF at a future block height.
export function createScheduledData(inputData: string, blockHeight: number): SQLUpdate {
  const nsdParams: INewScheduledDataParams = {
    block_height: blockHeight,
    input_data: inputData,
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
