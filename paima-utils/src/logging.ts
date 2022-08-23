import type { ChainData } from "./types";
import * as fs from "fs/promises";

export async function logBlock(block: ChainData) {
  const s1 = `${Date.now()} - ${block.blockNumber} block read, containing ${block.submittedData.length} pieces of input\n`
  await doLog(s1)
}
export async function logSuccess(block: ChainData) {
  const s2 = `${Date.now()} - ${block.blockNumber} OK\n`
  await doLog(s2)
}
export async function logError(error: any) {
  const s3 = `***ERROR***\n${error}\n***\n`;
  await doLog(s3)
}

export async function doLog(s: string) {
  console.log(s)
  try {
    await fs.appendFile("./logs.log", s)
  } catch {
    console.log(s)
  }
}