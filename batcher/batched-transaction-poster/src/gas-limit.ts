const BASE_GAS_COST = 50000;
const GAS_COST_PER_BYTE = 32;

export function estimateGasLimit(size: number): number {
  return GAS_COST_PER_BYTE * size + BASE_GAS_COST;
}
