import fs from 'fs';

export function getPlutusScript() {
  try {
    const data = JSON.parse(fs.readFileSync('../plutus.json', 'utf8'));
    return data;
  } catch (error) {
    console.error('Error reading plutus.json:', error);
    return null; // Or handle the error differently
  }
}
