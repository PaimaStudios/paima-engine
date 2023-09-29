import { describe, expect, test } from '@jest/globals';
import { getReadNamespaces, getWriteNamespace } from '../../src/security/parse';

const CONTRACT_ADDRESS = '0x35390c41200DD56Ac3A679a0c1EeA369444f3b60';
process.env.CONTRACT_ADDRESS = CONTRACT_ADDRESS;

describe('Test if parsed', () => {
  const startTest = (inputs: [string, number, string[]][]): void => {
    inputs.forEach(([namespace, blockHeight, expectedResult]: [string, number, string[]]) => {
      test(`${namespace} at blockHeight=${blockHeight} to be ${expectedResult}`, async () => {
        process.env.SECURITY_NAMESPACE = namespace;
        const result = await getReadNamespaces(blockHeight);
        expect(result).toEqual(expectedResult);
      });
    });
  };

  startTest([
    ['', 10, [CONTRACT_ADDRESS]],
    ['foo', 10, ['foo']],
    ['./test/security/config.yml', 10, [CONTRACT_ADDRESS]],
    ['./test/security/config.yml', 10000, [CONTRACT_ADDRESS, 'company_name']],
    ['./test/security/config.yml', 11000, [CONTRACT_ADDRESS, 'company_name']],
    ['./test/security/config.yml', 15000, ['new_company_name']],
  ]);

  test(`getWriteNamespace`, async () => {
    const result = await getWriteNamespace();
    expect(result).toEqual(CONTRACT_ADDRESS);
  });
});
