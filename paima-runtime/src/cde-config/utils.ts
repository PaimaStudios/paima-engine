import * as fs from 'fs/promises';

import { ChainDataExtensionType, doLog } from '@paima/utils';

import type { ChainDataExtension } from '../types';

const CDE_TYPE_MAP: Record<string, ChainDataExtensionType> = {
  erc20: ChainDataExtensionType.ERC20,
  erc721: ChainDataExtensionType.ERC721,
  'erc20-deposit': ChainDataExtensionType.ERC20Deposit,
  generic: ChainDataExtensionType.Generic,
};

export function parseCdeType(typeString: string): ChainDataExtensionType {
  if (CDE_TYPE_MAP[typeString]) {
    return CDE_TYPE_MAP[typeString];
  } else {
    return ChainDataExtensionType.UNKNOWN;
  }
}

export function getEarliestStartBlockheight(config: ChainDataExtension[]): number {
  const startBlockheights = config.map(cde => cde.startBlockHeight).filter(sbh => !!sbh);
  const minStartBlockheight = Math.min(...startBlockheights);
  return isFinite(minStartBlockheight) ? minStartBlockheight : -1;
}

export function requireFields(config: Record<string, any>, fieldNames: string[]): void {
  const missingFields: string[] = [];
  for (const fieldName of fieldNames) {
    if (!config[fieldName]) {
      missingFields.push(fieldName);
    }
  }
  if (missingFields.length > 0) {
    throw new Error(`[cde-config] missing fields: ${missingFields.join(', ')}`);
  }
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
        return abiJson.abi;
      }
    }
  } catch (err) {
    doLog(`[cde-config] ABI file at ${abiPath} has invalid structure`);
  }
  return [abiFileData, []];
}
