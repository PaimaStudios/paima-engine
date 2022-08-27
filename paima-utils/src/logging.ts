import type { ChainData } from "./types";
import * as fsa from "./fs_access/fsa.js"

export async function logBlock(block: ChainData) {
  const s = `Block #${block.blockNumber} received from Paima Funnel. Contains ${block.submittedData.length} pieces of input.`
  await doLog(s)
  if (block.submittedData.length) console.log(block)
}
export async function logSuccess(block: ChainData) {
  const s = `Block #${block.blockNumber} finished processing by Paima SM.`
  await doLog(s)
}
export async function logError(error: any) {
  const s = `***ERROR***\n${error}\n***`;
  await doLog(s)
}

export async function doLog(s: string) {
  console.log(s)
  try {
    await fsa.appendToFile(s)
  } catch { }
}