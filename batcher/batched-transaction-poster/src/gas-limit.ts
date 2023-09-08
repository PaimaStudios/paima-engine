import { ENV } from '@paima-batcher/utils';

const BASE_GAS_COST = ENV.MAX_BASE_GAS;
const GAS_COST_PER_BYTE = ENV.MAX_GAS_PER_BYTE;

export function estimateGasLimit(size: number): number {
  return GAS_COST_PER_BYTE * size + BASE_GAS_COST;
}
