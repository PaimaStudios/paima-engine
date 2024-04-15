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
      name: 'burn',
      inputs: [
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
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'burnBatch',
      inputs: [
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
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'currentNonce',
      inputs: [
        {
          name: 'user',
          type: 'address',
          internalType: 'address',
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
      name: 'mint',
      inputs: [
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
        {
          name: 'verificationData',
          type: 'bytes',
          internalType: 'bytes',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'mint',
      inputs: [
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
      outputs: [
        {
          name: '',
          type: 'uint256',
          internalType: 'uint256',
        },
      ],
      stateMutability: 'nonpayable',
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
      name: 'setBaseExtension',
      inputs: [
        {
          name: '_newBaseExtension',
          type: 'string',
          internalType: 'string',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'setBaseURI',
      inputs: [
        {
          name: '_URI',
          type: 'string',
          internalType: 'string',
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
          name: 'id',
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
      type: 'function',
      name: 'uri',
      inputs: [
        {
          name: 'id',
          type: 'uint256',
          internalType: 'uint256',
        },
        {
          name: 'customBaseUri',
          type: 'string',
          internalType: 'string',
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
      type: 'function',
      name: 'uri',
      inputs: [
        {
          name: 'id',
          type: 'uint256',
          internalType: 'uint256',
        },
        {
          name: 'customUriInterface',
          type: 'address',
          internalType: 'contract IUri',
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
      name: 'BatchMetadataUpdate',
      inputs: [
        {
          name: '_fromTokenId',
          type: 'uint256',
          indexed: false,
          internalType: 'uint256',
        },
        {
          name: '_toTokenId',
          type: 'uint256',
          indexed: false,
          internalType: 'uint256',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'MetadataUpdate',
      inputs: [
        {
          name: '_tokenId',
          type: 'uint256',
          indexed: false,
          internalType: 'uint256',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'Minted',
      inputs: [
        {
          name: 'tokenId',
          type: 'uint256',
          indexed: true,
          internalType: 'uint256',
        },
        {
          name: 'minter',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'userTokenId',
          type: 'uint256',
          indexed: true,
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
      name: 'SetBaseExtension',
      inputs: [
        {
          name: 'oldBaseExtension',
          type: 'string',
          indexed: false,
          internalType: 'string',
        },
        {
          name: 'newBaseExtension',
          type: 'string',
          indexed: false,
          internalType: 'string',
        },
      ],
      anonymous: false,
    },
    {
      type: 'event',
      name: 'SetBaseURI',
      inputs: [
        {
          name: 'oldUri',
          type: 'string',
          indexed: false,
          internalType: 'string',
        },
        {
          name: 'newUri',
          type: 'string',
          indexed: false,
          internalType: 'string',
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
  ],
};
