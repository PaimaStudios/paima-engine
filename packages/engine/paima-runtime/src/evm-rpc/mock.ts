/**
 * We can't truly provide this for a few reasons:
 * 1. Transactions aren't guaranteed to be on Ethereum (could be from a non-EVM chain)
 * 2. Even on Ethereum, Paima txs aren't guaranteed to be from an EOA accounts
 *    i.e. it could be a game tick, it could be an internal tx (EVM internal txs are regular txs in Paima), etc.
 *
 * TODO: we could decide to add this for historical_game_inputs for EVM chains if we really want to
 */
export const mockEvmEcdsaSignature = {
  /** ECDSA signature r */
  r: '0x0',
  /** ECDSA signature s */
  s: '0x0',
  /**
   * ECDSA recovery ID
   * note: replaced by yParity if type != 0x0
   */
  v: '0x0',
} as const;

/**
 * Gas specified before tx lands onchain (as part of the tx input given by the user)
 * Note: no concept of gas on Paima
 */
export const mockTxGasPre = {
  gas: '0x0',
  gasPrice: '0x0',
  // TODO: some other gas fields needed if we ever use type != 0x0
} as const;
/**
 * Gas specified after tx lands onchain (after calculating how much gas is consumed in reality)
 * Note: no concept of gas on Paima
 */
export const mockTxGasPost = {
  gasUsed: '0x0',
  effectiveGasPrice: '0x0',
  cumulativeGasUsed: '0x0',
} as const;
/**
 * Gas consumed for a block
 * Note: no concept of gas on Paima
 */
export const mockBlockGas = {
  gasLimit: '0x0',
  gasUsed: '0x0',
} as const;

/**
 * There is no concept of recipients in Paima since txs are to the state machine
 * TODO: there are some cases where, after processing the STF, we could determine if this tx was *to* a specific address
 *       or conversely, make that the STF fails if the state transition doesn't match some asserted *to* address
 *       so we could support some limited form of this if needed
 */
export const mockTxRecipient = {
  to: '0x0',
} as const;

/**
 * EVM has multiple tx types
 * - 0x0 for legacy transactions
 * - 0x1 for access list types
 * - 0x2 for dynamic fees
 *
 * Not all chains use 0x2, so it's not clear which we should use for mock data in Paima
 * Note: making this an ENV var doesn't make sense either since it's not something the node can know ahead of time
 *       since it depends on which tool is making the RPC query, not the node itself
 * We pick 0x0 for best chance at compatibility
 *
 * Note: if we change this to something other than 0x0, we also have to
 * 1. change `v` to `yParity` in the signature
 * 2. change the gas fields
 */
export const mockTxType = {
  type: '0x0',
} as const;

/**
 * Theoretically we could implement this in Paima, but it takes time to calculate and basically 0 dApps and tools use this
 * In fact, it's being set to empty-string with an EIP from 2024
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-7668.md
 */
export const mockLogBloom = {
  // TODO: unclear how this should be handled post-7668, but I assume `0x0` is the right approach
  // https://github.com/wevm/viem/pull/2587
  logsBloom: '0x0',
} as const;

/**
 * This is non-null when the transaction created a new contract
 * However, Paima doesn't support creating new contracts on the L2 side, so it's always null
 * Note: you could argue that maybe we might want this in a few cases:
 *       1. Dynamic primitives (so this would be the address in an underlying chain)
 *       2. Dynamically creating new precompiles
 */
export const mockContractAddress = {
  contractAddress: null,
} as const;

/**
 * No concept of miners in Paima (it's a based rollup) nor PoW
 */
export const mockMiner = {
  miner: '0x0',
  mixHash: '0x0',
  /** note: `nonce` here isn't a transaction nonce, but rather a nonce for PoW */
  nonce: '0x0',
  difficulty: '0x0',
  totalDifficulty: '0x0',
} as const;

/**
 * No concept of uncles in Paima as we only consider finalized blocks
 */
export const mockUncles = {
  sha3Uncles: '0x0',
  uncles: [],
} as const;

/**
 * Paima, similar to other chains like Solana, does not Merklize state for performance reasons
 * TODO: we could expose this as an ENV var if we really want/need to
 */
export const mockRoots = {
  transactionsRoot: '0x0',
  stateRoot: '0x0',
  receiptsRoot: '0x0',
};

/**
 * This has no purpose in Ethereum, but block creators can stuff whatever they want in here
 * No similar concept in Paima, but we could introduce a similar concept in theory when submitting to the L2 contract
 */
export const mockExtraData = {
  extraData: '0x0',
};

export const mockBlockHash = '0x0'; // TODO: do not mock this once we have block hashes in Paima
