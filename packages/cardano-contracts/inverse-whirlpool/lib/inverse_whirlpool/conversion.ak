use aiken/builtin
use aiken/bytearray
use aiken/list
use aiken/transaction.{
  Datum, DatumHash, InlineDatum, Input, NoDatum, Output, OutputReference,
}
use aiken/transaction/credential.{
  Address, Inline, ScriptCredential, VerificationKeyCredential,
}
use aiken/transaction/value.{Value}

pub fn convert_inputs(inputs: List<Input>) -> ByteArray {
  let (length, bytes) =
    list.foldr(
      inputs,
      (0, ""),
      fn(input, acc) {
        let OutputReference(hash, index) = input.output_reference

        (
          acc.1st + 1,
          bytearray.concat(#"82", builtin.serialise_data(hash.hash))
            |> bytearray.concat(builtin.serialise_data(index))
            |> bytearray.concat(acc.2nd),
        )
      },
    )

  if length <= 23 {
    builtin.cons_bytearray(128 + length, bytes)
  } else {
    bytearray.concat(#"9f", bytes) |> bytearray.concat(#"ff")
  }
}

pub fn convert_mint(mint: Value) -> ByteArray {
  mint |> builtin.serialise_data
}

pub fn convert_outputs(outputs: List<Output>) -> ByteArray {
  let (length, bytes) =
    list.foldr(
      outputs,
      (0, ""),
      fn(output, acc) {
        let Output { address, value, datum, .. } = output

        let (add_datum, datum_bytes) = convert_datum(datum)
        (
          acc.1st + 1,
          builtin.cons_bytearray(130 + add_datum, convert_address(address))
            |> bytearray.concat(convert_value(value))
            |> bytearray.concat(datum_bytes)
            |> bytearray.concat(acc.2nd),
        )
      },
    )

  if length <= 23 {
    builtin.cons_bytearray(128 + length, bytes)
  } else {
    bytearray.concat(#"9f", bytes) |> bytearray.concat(#"ff")
  }
}

pub fn convert_fee(fee: Value) -> ByteArray {
  value.lovelace_of(fee) |> builtin.serialise_data
}

pub fn convert_extra_signatories(signatures: List<ByteArray>) -> ByteArray {
  let (length, bytes) =
    list.foldr(
      signatures,
      (0, ""),
      fn(signature, acc) {
        (
          acc.1st + 1,
          bytearray.concat(builtin.serialise_data(signature), acc.2nd),
        )
      },
    )
  if length <= 23 {
    builtin.cons_bytearray(128 + length, bytes)
  } else {
    bytearray.concat(#"9f", bytes) |> bytearray.concat(#"ff")
  }
}

fn convert_datum(datum: Datum) -> (Int, ByteArray) {
  when datum is {
    NoDatum -> (0, "")
    DatumHash(datum_hash) -> (1, datum_hash)
    InlineDatum(datum_bytes) -> (1, builtin.serialise_data(datum_bytes))
  }
}

fn convert_value(assets: Value) -> ByteArray {
  let lovelace = value.lovelace_of(assets) |> builtin.serialise_data
  let multi_asset = value.without_lovelace(assets) |> builtin.serialise_data

  if multi_asset == #"a0" {
    lovelace
  } else {
    #"82" |> bytearray.concat(lovelace) |> bytearray.concat(multi_asset)
  }
}

fn convert_address(address: Address) -> ByteArray {
  //; bit 4: payment cred is keyhash/scripthash
  let (header_byte_pc, credential_p) =
    when address.payment_credential is {
      ScriptCredential(cred) -> (16, cred)
      VerificationKeyCredential(cred) -> (0, cred)
    }
  let (header_byte_sc, credential_s) =
    when address.stake_credential is {
      None -> (96, "")
      Some(Inline(VerificationKeyCredential(cred))) -> (0, cred)
      Some(Inline(ScriptCredential(cred))) -> (32, cred)
      _ -> fail @"no way"
    }
  builtin.cons_bytearray(
    header_byte_pc + header_byte_sc,
    bytearray.concat(credential_p, credential_s),
  )
    |> builtin.serialise_data
}
