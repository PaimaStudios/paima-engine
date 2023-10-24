import { describe, expect, test } from '@jest/globals';
import { parseCdeConfigFile } from '../src/cde-config/loading.js';
import * as fs from 'fs/promises';

// TODO: test if addresses get converted to lowercase properly

describe('Test parsing CDE config files', () => {
  test(`parse CDE configs`, async () => {
    const configFileData = await fs.readFile('./test/example.yml', 'utf8');
    expect(() => parseCdeConfigFile(configFileData)).not.toThrow();
  });
});
