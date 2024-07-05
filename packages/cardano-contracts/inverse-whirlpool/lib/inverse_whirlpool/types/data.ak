use aiken/hash.{Blake2b_224, Hash}
use aiken/transaction/credential.{VerificationKey}
use aiken/transaction/value.{AssetName, PolicyId}

/// Public key hash
pub type VKeyHash =
  Hash<Blake2b_224, VerificationKey>

/// Public key hash
pub type State {
  mint: Int,
}

/// Number of tokens in circulation
pub type ContractInfo {
  state: State,
  /// State (datum) on eUTXO
  lovelace: Int,
}

/// Lovelace on eUTXO
pub type Asset {
  policy: PolicyId,
  /// Policy ID of the minting authority
  asset_name: AssetName,
  /// Name of asset in hexidecimal
  quantity: Int,
}
/// Number of token
