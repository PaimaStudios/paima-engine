use aiken/builtin
use aiken/bytearray
use aiken/cbor
use aiken/dict
use aiken/hash
use aiken/list
use aiken/option
use aiken/pairs
use aiken/sparse_merkle_tree_blake256.{verify_added_member}
use aiken/transaction.{
  InlineDatum, Input, Mint, Output, OutputReference, ScriptContext, Spend,
  Transaction,
}
use aiken/transaction/credential.{
  Address, Inline, ScriptCredential, VerificationKeyCredential,
}
use aiken/transaction/value
use inverse_whirlpool/conversion.{
  convert_extra_signatories, convert_fee, convert_inputs, convert_mint,
  convert_outputs,
}
use inverse_whirlpool/types/actions.{
  BurnToken, MintActionType, MintToken, TransactionBodyPieces,
}
use inverse_whirlpool/utils.{get_inline_datum, list_at, skip_to}
use inverse_whirlpool/validation.{
  Account, BurnAccount, CreateAccount, DestroyAccount, IncrementAccount,
  InitMerkle, Merkle, MintActions, SpendMerkleRoot, State, ValidateActions,
  init_merkle,
}

validator(init_ref: OutputReference) {
  fn merkle_minter(rdmr: MintActions, ctx: ScriptContext) -> Bool {
    expect ScriptContext { transaction: tx, purpose: Mint(own_policy) } = ctx

    let expected_address = Address(ScriptCredential(own_policy), None)

    // Use empty asset name as the master token
    let expected_value = value.from_asset(own_policy, "", 1)

    when rdmr is {
      InitMerkle ->
        init_merkle(init_ref, tx, own_policy, expected_address, expected_value)

      CreateAccount { account, merkle_proof_block, output_index } -> {
        let account_hash = account |> builtin.serialise_data |> hash.blake2b_256

        expect Some(merkle_input) =
          tx.inputs
            |> list.find(fn(input) { input.output.address == expected_address })

        let Output { value: input_value, datum: input_data, .. } =
          merkle_input.output

        expect Merkle { root: input_root, .. }: State =
          get_inline_datum(input_data)

        expect [merkle_output, user_account_output, ..] =
          skip_to(tx.outputs, output_index)

        let Output {
          address: output_address,
          value: output_value,
          datum: output_data,
          ..
        } = merkle_output

        expect Merkle { root: output_root, own_hash }: State =
          get_inline_datum(output_data)

        let Output {
          address: account_address,
          value: account_value,
          datum: account_data,
          ..
        } = user_account_output

        let expected_account_value =
          value.from_asset(own_policy, account_hash, 1)

        // Control mint value
        expect [Pair(minted_token, 1)] =
          tx.mint
            |> value.from_minted_value
            |> value.tokens(own_policy)
            |> dict.to_pairs

        and {
          // Verify new and old merkle roots
          verify_added_member(
            account,
            fn(a) { builtin.serialise_data(a) },
            merkle_proof_block,
            input_root,
            output_root,
          ),
          // Verify utxo is preserved
          value.without_lovelace(input_value) == expected_value,
          output_address == expected_address,
          value.without_lovelace(output_value) == expected_value,
          own_hash == own_policy,
          // Verify account token is created
          minted_token == account_hash,
          // Verify account utxo is created
          account_address.payment_credential == ScriptCredential(own_policy),
          value.without_lovelace(account_value) == expected_account_value,
          account_data == InlineDatum(Account(account, 1)),
        }
      }

      BurnAccount -> {
        expect [Pair(_, amount)] =
          tx.mint
            |> value.from_minted_value
            |> value.tokens(own_policy)
            |> dict.to_pairs
        amount == -1
      }
    }
  }

  fn validate(datum: State, rdmr: ValidateActions, ctx: ScriptContext) -> Bool {
    when rdmr is {
      SpendMerkleRoot -> {
        // Depend on the execution of the mint contract to ensure spend validation
        expect Merkle(policy_id, _) = datum

        expect [Pair(_, amount)] =
          ctx.transaction.mint
            |> value.from_minted_value
            |> value.tokens(policy_id)
            |> dict.to_pairs

        amount == 1
      }
      IncrementAccount(output_index) -> {
        expect Spend(own_ref) = ctx.purpose

        expect Account(credential, current_amount) = datum

        expect Some(own_input) =
          list.find(
            ctx.transaction.inputs,
            fn(input) { input.output_reference == own_ref },
          )
            |> option.map(fn(input) { input.output })

        let Output { address: input_address, value: input_value, .. } =
          own_input

        let Output {
          address: output_address,
          value: output_value,
          datum: output_data,
          ..
        } = list_at(ctx.transaction.outputs, output_index)

        and {
          when credential is {
            VerificationKeyCredential(vk) ->
              list.has(ctx.transaction.extra_signatories, vk)

            sh -> pairs.has_key(ctx.transaction.withdrawals, Inline(sh))
          },
          input_address == output_address,
          value.without_lovelace(input_value) == value.without_lovelace(
            output_value,
          ),
          output_data == InlineDatum(Account(credential, current_amount + 1)),
        }
      }

      DestroyAccount -> {
        // Depend on the execution of the mint contract to ensure spend validation
        expect Account(credential, _) = datum

        expect Spend(own_ref) = ctx.purpose

        expect Some(own_script_hash) =
          ctx.transaction.inputs
            |> list.find(fn(input) { input.output_reference == own_ref })
            |> option.map(
                fn(input) {
                  when input.output.address.payment_credential is {
                    ScriptCredential(own_script_hash) -> own_script_hash
                    _ -> fail @"Impossible"
                  }
                },
              )

        expect [Pair(token_name, amount)] =
          ctx.transaction.mint
            |> value.from_minted_value
            |> value.tokens(own_script_hash)
            |> dict.to_pairs

        and {
          amount == -1,
          token_name == (
            credential
              |> builtin.serialise_data
              |> hash.blake2b_256
          ),
          when credential is {
            VerificationKeyCredential(vk) ->
              list.has(ctx.transaction.extra_signatories, vk)

            sh -> pairs.has_key(ctx.transaction.withdrawals, Inline(sh))
          },
        }
      }
    }
  }
}

validator {
  fn mint(action: Data, context: ScriptContext) -> Bool {
    let ScriptContext { transaction, purpose } = context
    let Transaction { inputs, outputs, extra_signatories, mint, fee, id, .. } =
      transaction

    // Expect that the tx is minting
    expect Mint(script_policy_id) = purpose

    // Deconstruct the transaction into its base components:
    // Inputs, Outputs, Inline Datum, and a list of Minted Tokens
    let mint = value.from_minted_value(mint)

    trace @"Mint Preamble Complete"

    trace cbor.diagnostic(action)

    expect action: MintActionType = action

    when action is {
      BurnToken ->
        list.all(
          mint |> value.tokens(script_policy_id) |> dict.to_pairs,
          fn(amount_map) {
            let Pair(_, amount) = amount_map
            amount == -1
          },
        )
      MintToken(_, tx_body, _) -> {
        let TransactionBodyPieces {
          collateral_inputs,
          collateral_output,
          collateral_fee,
          ..
        } = tx_body

        expect [Pair(script_data_hash, 1), ..] =
          mint
            |> value.tokens(
                #"9fc33a6ffaa8d1f600c161aa383739d5af37807ed83347cc133521c9",
              )
            |> dict.to_pairs

        let inputs_cbor = convert_inputs(inputs) |> bytearray.concat(#"00", _)
        let outputs_cbor =
          convert_outputs(outputs) |> bytearray.concat(#"01", _)
        let fee_cbor = convert_fee(fee) |> bytearray.concat(#"02", _)
        let mint_cbor = convert_mint(mint) |> bytearray.concat(#"09", _)

        let script_data_hash_cbor =
          builtin.serialise_data(script_data_hash) |> bytearray.concat(#"0b", _)

        let extra_signatories_cbor =
          convert_extra_signatories(extra_signatories)
            |> bytearray.concat(#"0e", _)

        // let _ref_inputs_cbor =
        //  convert_inputs(reference_inputs) |> bytearray.concat(#"12", _)
        let collateral_inputs_cbor = bytearray.concat(#"0d", collateral_inputs)

        let collateral_output_cbor = bytearray.concat(#"10", collateral_output)
        let collateral_fee_cbor = bytearray.concat(#"11", collateral_fee)

        let tx_cbor =
          #"a9"
            |> bytearray.concat(inputs_cbor)
            |> bytearray.concat(outputs_cbor)
            |> bytearray.concat(fee_cbor)
            |> bytearray.concat(mint_cbor)
            |> bytearray.concat(script_data_hash_cbor)
            |> bytearray.concat(collateral_inputs_cbor)
            |> bytearray.concat(extra_signatories_cbor)
            |> bytearray.concat(collateral_output_cbor)
            |> bytearray.concat(collateral_fee_cbor)

        trace @"INFO CBOR SERIALIZED TX:"
        trace bytearray.to_hex(tx_cbor)

        trace tx_cbor |> builtin.blake2b_256 |> bytearray.to_hex

        trace bytearray.to_hex(id.hash)

        // expect Some(input) =
        //   list.find(inputs, fn(input) { input_ref == input.output_reference })
        // let Input { output: Output { value, datum, .. }, .. } = input
        // expect Account(credential, amount): State = get_inline_datum(datum)
        // let expected_value =
        //   value.from_asset(
        //     merkle_policy,
        //     credential |> builtin.serialise_data |> hash.blake2b_256,
        //     1,
        //   )
        expect [Pair(token_name, 1)] =
          mint |> value.tokens(script_policy_id) |> dict.to_pairs

        and {
          id.hash != ( tx_cbor |> builtin.blake2b_256 ),
          token_name == token_name,
        }
      }
    }
    // and {
    //   expected_value == value.without_lovelace(value),
    //   token_name == (
    //     credential
    //       |> builtin.serialise_data
    //       |> bytearray.concat(amount |> builtin.serialise_data)
    //       |> hash.blake2b_256
    //   ),
    // }
  }
}
