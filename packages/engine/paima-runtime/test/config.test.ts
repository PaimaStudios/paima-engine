import { describe, expect, test } from '@jest/globals';
import Web3 from 'web3';
import { loadChainDataExtensions } from '../src/cde-config/loading.js';

// TODO: test if addresses get converted to lowercase properly

describe('Test if parsed', () => {
  test(`placeholder`, async () => {
    const web3 = new Web3();
    await loadChainDataExtensions(web3, './example.yml');
    expect(false).toEqual(false);
  });
});
