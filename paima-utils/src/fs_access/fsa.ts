import * as fs from 'fs';

export function appendToFile(s: string): void {
  fs.appendFileSync('./logs.log', s);
}
