import * as fs from 'fs';

export function appendToFile(s: string): void {
  try {
    fs.appendFileSync('./logs.log', `${s}\n`);
  } catch {}
}
