import * as fs from 'fs/promises';

export async function appendToFile(s: string): Promise<void> {
  try {
    await fs.appendFile('./logs.log', s);
  } catch {}
}
