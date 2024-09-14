import type { SQLUpdate } from './types.js';
import {
  newScheduledHeightData,
  newScheduledTimestampData,
  removeAllScheduledDataByInputData,
  removeScheduledBlockData,
} from './sql/rollup_inputs.queries.js';
import type {
  INewScheduledHeightDataParams,
  INewScheduledTimestampDataParams,
  IRemoveAllScheduledDataByInputDataParams,
  IRemoveScheduledBlockDataParams,
} from './sql/rollup_inputs.queries.js';
import { strip0x } from '@paima/utils';

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
  trigger: { blockHeight: number } | { timestamp: Date },
  source:
    | {
        cdeName: string;
        txHash: string;
        caip2: string;
        fromAddress: string;
        contractAddress: undefined | string;
      }
    | {
        precompile: string;
      }
): SQLUpdate {
  if ('blockHeight' in trigger) {
    const sourceParams =
      'precompile' in source
        ? {
            from_address: source.precompile,
            primitive_name: null,
            origin_tx_hash: null,
            caip2: null,
            origin_contract_address: null,
          }
        : {
            from_address: source.fromAddress,
            primitive_name: source.cdeName,
            origin_tx_hash: Buffer.from(strip0x(source.txHash), 'hex'),
            caip2: source.caip2,
            origin_contract_address: source.contractAddress,
          };

    const nsdParams: INewScheduledHeightDataParams = {
      future_block_height: trigger.blockHeight,
      input_data: inputData,
      ...sourceParams,
    };
    const newScheduledDataTuple: SQLUpdate = [newScheduledHeightData, nsdParams];
    return newScheduledDataTuple;
  } else {
    if (!('precompile' in source)) {
      // in particular extensions only schedule data in the same block they trigger
      throw new Error('Extensions should not schedule timers by date');
    }

    const nsdParams: INewScheduledTimestampDataParams = {
      future_ms_timestamp: trigger.timestamp,
      input_data: inputData,
      from_address: source.precompile,
    };
    const newScheduledDataTuple: SQLUpdate = [newScheduledTimestampData, nsdParams];
    return newScheduledDataTuple;
  }
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
  const dsdParams: IRemoveScheduledBlockDataParams = {
    block_height: blockHeight,
    input_data: inputData,
  };
  return [removeScheduledBlockData, dsdParams];
}
