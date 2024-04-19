import * as fs from 'fs/promises';

import { doLog } from '@paima/utils';

import type { ChainDataExtension } from '@paima/sm';

export function getEarliestStartBlockheight(config: ChainDataExtension[], network: string): number {
  const minStartBlockheight = config.reduce((min, cde) => {
    if ('startBlockHeight' in cde && cde.network === network) {
      return Math.min(min, cde.startBlockHeight);
    }
    return min;
  }, Infinity);
  return isFinite(minStartBlockheight) ? minStartBlockheight : -1;
}

export function getEarliestStartSlot(config: ChainDataExtension[]): number {
  const minStartSlot = config.reduce((min, cde) => {
    if ('startSlot' in cde) {
      return Math.min(min, cde.startSlot);
    }
    return min;
  }, Infinity);
  return isFinite(minStartSlot) ? minStartSlot : -1;
}

/**
 * Read a contract ABI from a JSON file into an array.
 * @param abiPath The JSON file path to read from.
 * @returns The root if it is an array, the `abi` field if the root is an object, or `[]` on error.
 */
export async function loadAbi(abiPath: string): Promise<any[]> {
  let abiFileData: string;
  try {
    abiFileData = await fs.readFile(abiPath, 'utf8');
  } catch (err) {
    doLog(`[cde-config] ABI file not found: ${abiPath}`);
    return [];
  }
  try {
    let abiJson = JSON.parse(abiFileData);

    // some tools give the ABI directly
    if (Array.isArray(abiJson)) {
      return abiJson;
    }
    // but some tools give an object with an `abi` key
    if (typeof abiJson === 'object' && !!abiJson) {
      if (Object.hasOwn(abiJson as object, 'abi') && Array.isArray(abiJson.abi)) {
        return abiJson.abi;
      }
    }
  } catch (err) {
    doLog(`[cde-config] ABI file at ${abiPath} has invalid structure`, err);
  }
  return [];
}
