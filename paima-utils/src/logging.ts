import type { ChainData } from "./types";
import * as fsa from "./fs_access/fsa.js"

export async function logBlock(block: ChainData) {
  const s = `${Date.now()} - ${block.blockNumber} block read, containing ${block.submittedData.length} pieces of input\n`
  await doLog(s)
}
export async function logSuccess(block: ChainData) {
  const s = `${Date.now()} - ${block.blockNumber} OK\n`
  await doLog(s)
}
export async function logError(error: any) {
  const s = `***ERROR***\n${error}\n***\n`;
  await doLog(s)
}

export async function doLog(s: string) {
  console.log(s)
  try {
    await fsa.appendToFile(s)
  } catch { }
}