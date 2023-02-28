import { newScheduledData, removeScheduledData } from './scheduled.queries';
import type { INewScheduledDataParams, IRemoveScheduledDataParams } from './scheduled.queries';
import type { SQLUpdate } from '../types';

// Create an SQL update which schedules a piece of data to be run through
// the STF at a future block height.
export function createScheduledData(inputData: string, blockHeight: number): SQLUpdate[] {
  const nsdParams: INewScheduledDataParams = {
    block_height: blockHeight,
    input_data: inputData,
  };
  const newScheduledDataTuple: SQLUpdate = [newScheduledData, nsdParams];
  return newScheduledDataTuple;
}

// Create an SQL update which deletes an upcoming scheduled data
export function deleteScheduledData(inputData: string, blockHeight: number): SQLUpdate[] {
  const dsdParams: IRemoveScheduledDataParams = {
    block_height: blockHeight,
    input_data: inputData,
  };
  const deleteScheduledDataTuple: SQLUpdate = [removeScheduledData, dsdParams];
  return deleteScheduledDataTuple;
}
