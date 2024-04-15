export default {
  abi: [
    {
      type: 'function',
      name: 'balanceOf',
      inputs: [
        {
          name: 'account',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'id',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'balanceOfBatch',
      inputs: [
        {
          name: 'accounts',
          type: 'address[]',
          internalType: 'address[]',
        },
        {
          name: 'ids',
          type: 'uint256[]',
          internalType: 'uint256[]',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint256[]',
          internalType: 'uint256[]',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'isApprovedForAll',
      inputs: [
        {
          name: 'account',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'operator',
          type: 'address',
          internalType: 'address',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'bool',
          internalType: 'bool',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'safeBatchTransferFrom',
      inputs: [
        {
          name: 'from',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'to',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'ids',
          type: 'uint256[]',
          internalType: 'uint256[]',
        },
        {
          name: 'values',
          type: 'uint256[]',
          internalType: 'uint256[]',
        },
        {
          name: 'data',
          type: 'bytes',
          internalType: 'bytes',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'safeTransferFrom',
      inputs: [
        {
          name: 'from',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'to',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'id',
          type: 'uint256',
          internalType: 'uint256',
        },
        {
          name: 'value',
          type: 'uint256',
          internalType: 'uint256',
        },
        {
          name: 'data',
          type: 'bytes',
          internalType: 'bytes',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'setApprovalForAll',
      inputs: [
        {
          name: 'operator',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'approved',
          type: 'bool',
          internalType: 'bool',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'supportsInterface',
      inputs: [
        {
          name: 'interfaceId',
          type: 'bytes4',
          internalType: 'bytes4',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'bool',
          internalType: 'bool',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'uri',
      inputs: [
        {
          name: '',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'string',
          internalType: 'string',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'event',
      name: 'ApprovalForAll',
      inputs: [
        {
          name: 'account',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'operator',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'approved',
          type: 'bool',
          indexed: false,
          internalType: 'bool',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'TransferBatch',
      inputs: [
        {
          name: 'operator',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'from',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'to',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'ids',
          type: 'uint256[]',
          indexed: false,
          internalType: 'uint256[]',
        },
        {
          name: 'values',
          type: 'uint256[]',
          indexed: false,
          internalType: 'uint256[]',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'TransferSingle',
      inputs: [
        {
          name: 'operator',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'from',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'to',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'id',
          type: 'uint256',
          indexed: false,
          internalType: 'uint256',
        },
        {
          name: 'value',
          type: 'uint256',
          indexed: false,
          internalType: 'uint256',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'URI',
      inputs: [
        {
          name: 'value',
          type: 'string',
          indexed: false,
          internalType: 'string',
        },
        {
          name: 'id',
          type: 'uint256',
          indexed: true,
          internalType: 'uint256',
        },
      ],
      anonymous: false,
    },
    {
      type: 'error',
      name: 'ERC1155InsufficientBalance',
      inputs: [
        {
          name: 'sender',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'balance',
          type: 'uint256',
          internalType: 'uint256',
        },
        {
          name: 'needed',
          type: 'uint256',
          internalType: 'uint256',
        },
        {
          name: 'tokenId',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
    },
    {
      type: 'error',
      name: 'ERC1155InvalidApprover',
      inputs: [
        {
          name: 'approver',
          type: 'address',
          internalType: 'address',
        },
      ],
    },
    {
      type: 'error',
      name: 'ERC1155InvalidArrayLength',
      inputs: [
        {
          name: 'idsLength',
          type: 'uint256',
          internalType: 'uint256',
        },
        {
          name: 'valuesLength',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
    },
    {
      type: 'error',
      name: 'ERC1155InvalidOperator',
      inputs: [
        {
          name: 'operator',
          type: 'address',
          internalType: 'address',
        },
      ],
    },
    {
      type: 'error',
      name: 'ERC1155InvalidReceiver',
      inputs: [
        {
          name: 'receiver',
          type: 'address',
          internalType: 'address',
        },
      ],
    },
    {
      type: 'error',
      name: 'ERC1155InvalidSender',
      inputs: [
        {
          name: 'sender',
          type: 'address',
          internalType: 'address',
        },
      ],
    },
    {
      type: 'error',
      name: 'ERC1155MissingApprovalForAll',
      inputs: [
        {
          name: 'operator',
          type: 'address',
          internalType: 'address',
        },
        {
          name: 'owner',
          type: 'address',
          internalType: 'address',
        },
      ],
    },
  ],
};
