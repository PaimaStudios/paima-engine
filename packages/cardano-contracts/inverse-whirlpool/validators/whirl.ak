use aiken/builtin
use aiken/dict
use aiken/hash
use aiken/list
use aiken/option
use aiken/sparse_merkle_tree_blake256.{verify_added_member}
use aiken/transaction.{
  InlineDatum, Mint, Output, OutputReference, ScriptContext, Spend,
}
use aiken/transaction/credential.{
  Address, Inline, ScriptCredential, VerificationKeyCredential,
}
use aiken/transaction/value
use inverse_whirlpool/utils.{get_inline_datum, list_at, skip_to}
use inverse_whirlpool/validation.{
  Account, BurnAccount, CreateAccount, DestroyAccount, IncrementAccount,
  InitMerkle, Merkle, MintActions, SpendMerkleRoot, State, ValidateActions,
  init_merkle,
}

validator(init_ref: OutputReference) {
  fn minter(rdmr: MintActions, ctx: ScriptContext) -> Bool {
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
        expect [(minted_token, 1)] =
          tx.mint
            |> value.from_minted_value
            |> value.tokens(own_policy)
            |> dict.to_list

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
        expect [(_, amount)] =
          tx.mint
            |> value.from_minted_value
            |> value.tokens(own_policy)
            |> dict.to_list
        amount == -1
      }
    }
  }

  fn validate(datum: State, rdmr: ValidateActions, ctx: ScriptContext) -> Bool {
    when rdmr is {
      SpendMerkleRoot -> {
        // Depend on the execution of the mint contract to ensure spend validation
        expect Merkle(policy_id, _) = datum

        expect [(_, amount)] =
          ctx.transaction.mint
            |> value.from_minted_value
            |> value.tokens(policy_id)
            |> dict.to_list

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

            sh -> dict.has_key(ctx.transaction.withdrawals, Inline(sh))
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

        expect [(token_name, amount)] =
          ctx.transaction.mint
            |> value.from_minted_value
            |> value.tokens(own_script_hash)
            |> dict.to_list

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

            sh -> dict.has_key(ctx.transaction.withdrawals, Inline(sh))
          },
        }
      }
    }
  }
}
