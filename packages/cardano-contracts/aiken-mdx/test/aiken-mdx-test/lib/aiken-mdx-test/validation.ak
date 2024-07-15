use aiken/dict
use aiken/list
use aiken/sparse_merkle_tree/merkle_blake256.{MerkleProofBlock}
use aiken/sparse_merkle_tree_blake256.{init_root}
use aiken/transaction.{InlineDatum, Output, OutputReference, Transaction}
use aiken/transaction/credential.{Address, Credential}
use aiken/transaction/value.{PolicyId, Value}

pub type MintActions {
  InitMerkle
  CreateAccount {
    account: Credential,
    merkle_proof_block: MerkleProofBlock<Credential>,
    output_index: Int,
  }
  BurnAccount
  /// Test comment
  TupleTest { val: TupleTest }
  DataTest { val: Data }
  VoidTest { val: Void }
  PairTest { val: PairTest }
  PairsTest { val: PairsTest }
  ListTest { val: ListTest }
}

type TemplateTest<inner_type> {
  Box(inner_type)
}

pub type ValidateActions {
  SpendMerkleRoot
  IncrementAccount(Int)
  DestroyAccount
}

pub type RootHash =
  ByteArray

pub type State {
  Merkle { root: RootHash, own_hash: PolicyId }
  Account(Credential, Int)
}

pub type TupleTest =
  (Int, ByteArray)

pub type PairTest =
  Pair<Int, ByteArray>

pub type PairsTest =
  Pairs<Int, ByteArray>

pub type ListTest =
  List<Int>

pub fn init_merkle(
  init_ref: OutputReference,
  tx: Transaction,
  own_policy: PolicyId,
  expected_address: Address,
  expected_value: Value,
) -> Bool {
  expect _a = Box(420)
  expect Some(_) =
    tx.inputs |> list.find(fn(i) { i.output_reference == init_ref })

  let expected_data =
    init_root()
      |> Merkle(own_policy)
      |> InlineDatum

  expect [first_output, ..] = tx.outputs

  // Control mint value
  expect [(_, 1)] =
    tx.mint
      |> value.from_minted_value
      |> value.tokens(own_policy)
      |> dict.to_list

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
