import * as fs from 'fs/promises';

import { ChainDataExtensionType, doLog } from '@paima/utils';

import type { ChainDataExtension } from '@paima/sm';

export function getEarliestStartBlockheight(config: ChainDataExtension[]): number {
  const minStartBlockheight = config.reduce((min, cde) => {
    if (cde.cdeType !== ChainDataExtensionType.CardanoPool) {
      return Math.min(min, cde.startBlockHeight);
    }
    return min;
  }, Infinity);
  return isFinite(minStartBlockheight) ? minStartBlockheight : -1;
}

export function getEarliestStartSlot(config: ChainDataExtension[]): number {
  const minStartSlot = config.reduce((min, cde) => {
    if (cde.cdeType === ChainDataExtensionType.CardanoPool) {
      return Math.min(min, cde.startSlot);
    }
    return min;
  }, Infinity);
  return isFinite(minStartSlot) ? minStartSlot : -1;
}

// returns pair [rawAbiFileData, artifactObject.abi]
export async function loadAbi(abiPath: string): Promise<[string, any[]]> {
  let abiFileData: string = '';
  try {
    abiFileData = await fs.readFile(abiPath, 'utf8');
  } catch (err) {
    doLog(`[cde-config] ABI file not found: ${abiPath}`);
    return [abiFileData, []];
  }
  try {
    let abiJson = JSON.parse(abiFileData);
    if (typeof abiJson === 'object' && !!abiJson) {
      if (Object.hasOwn(abiJson as object, 'abi') && Array.isArray(abiJson.abi)) {
        return [abiFileData, abiJson.abi];
      }
    }
  } catch (err) {
    doLog(`[cde-config] ABI file at ${abiPath} has invalid structure`);
  }
  return [abiFileData, []];
}
