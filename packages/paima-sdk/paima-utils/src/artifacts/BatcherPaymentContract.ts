export default {
  contractName: 'BatcherPayment',
  abi: [
    {
      type: 'function',
      name: 'balance',
      inputs: [{ name: '', type: 'address', internalType: 'address' }],
      outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'payBatcher',
      inputs: [{ name: 'batcherAddress', type: 'address', internalType: 'address' }],
      outputs: [],
      stateMutability: 'payable',
    },
    {
      type: 'function',
      name: 'payBatcherFor',
      inputs: [
        { name: 'batcherAddress', type: 'address', internalType: 'address' },
        { name: 'forAddress', type: 'address', internalType: 'address' },
      ],
      outputs: [],
      stateMutability: 'payable',
    },
    {
      type: 'function',
      name: 'withdrawFunds',
      inputs: [],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'event',
      name: 'FundsWithdrawn',
      inputs: [
        { name: 'batcherAddress', type: 'address', indexed: true, internalType: 'address' },
        { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'Payment',
      inputs: [
        { name: 'userAddress', type: 'address', indexed: true, internalType: 'address' },
        { name: 'batcherAddress', type: 'address', indexed: true, internalType: 'address' },
        { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' },
      ],
      anonymous: false,
    },
    {
      type: 'error',
      name: 'AddressInsufficientBalance',
      inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    },
    { type: 'error', name: 'FailedInnerCall', inputs: [] },
  ],
};
