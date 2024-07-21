use aiken/dict
use aiken/list
use aiken/merkle_patricia_forestry.{Proof}
use aiken/merkle_patricia_forestry/merkling.{null_hash}
use aiken/transaction.{InlineDatum, Output, OutputReference, Transaction}
use aiken/transaction/credential.{Address, Credential}
use aiken/transaction/value.{PolicyId, Value}
use inverse_whirlpool/types/data.{RootHash}

pub type MintActions {
  InitMerkle
  CreateAccount {
    account: Credential,
    merkle_proof_block: Proof,
    output_index: Int,
  }
  BurnAccount
}

pub type ValidateActions {
  SpendMerkleRoot
  IncrementAccount(Int)
  DestroyAccount
}

pub type State {
  Merkle { root: RootHash, own_hash: PolicyId }
  Account(Credential, Int)
}

pub fn init_merkle(
  init_ref: OutputReference,
  tx: Transaction,
  own_policy: PolicyId,
  expected_address: Address,
  expected_value: Value,
) -> Bool {
  expect Some(_) =
    tx.inputs |> list.find(fn(i) { i.output_reference == init_ref })

  let expected_data =
    null_hash
      |> Merkle(own_policy)
      |> InlineDatum

  expect [first_output, ..] = tx.outputs

  // Control mint value
  expect [Pair(_, 1)] =
    tx.mint
      |> value.from_minted_value
      |> value.tokens(own_policy)
      |> dict.to_pairs

  let Output {
    address: actual_address,
    value: actual_value,
    datum: actual_data,
    ..
  } = first_output

  and {
    actual_address == expected_address,
    value.without_lovelace(actual_value) == expected_value,
    actual_data == expected_data,
  }
}
