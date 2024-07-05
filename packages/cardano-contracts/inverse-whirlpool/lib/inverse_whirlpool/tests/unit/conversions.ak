// test foo() {
//   trace cbor.diagnostic(#"aabbccddeeff")
//   trace cbor.serialise(#"aabbccddeeff") |> bytearray.to_hex()

//   trace cbor.diagnostic(
//     #"aabbccddeeffaabbccddeeffaabbccddeeffaabbccddeeffaabbccddeeffaabb",
//   )
//   trace cbor.serialise(
//     #"aabbccddeeffaabbccddeeffaabbccddeeffaabbccddeeffaabbccddeeffaabb",
//   )
//     |> bytearray.to_hex()

//   trace cbor.diagnostic(
//     (#"aabbccddeeffaabbccddeeffaabbccddeeffaabbccddeeffaabbccddeeffaabb", 256),
//   )
//   trace cbor.serialise(
//     (#"aabbccddeeffaabbccddeeffaabbccddeeffaabbccddeeffaabbccddeeffaabb", 256),
//   )
//     |> bytearray.to_hex()

//   True
// }

// test foo2() {
//   trace [
//     Pair(#"00e568406499afa042fd1f34207d1d5b4a3d87ec2767ccfd7b5e087d",
//     [
//       Pair(#"4465706f7369746f7279204e6f7465", -1),
//       Pair(#"624b47304a386b61525a4f34785a7432673670415267", 1),
//     ]),
//   ]
//     |> cbor.diagnostic
//   trace [
//     Pair(#"00e568406499afa042fd1f34207d1d5b4a3d87ec2767ccfd7b5e087d",
//     [
//       Pair(#"4465706f7369746f7279204e6f7465", -1),
//       Pair(#"624b47304a386b61525a4f34785a7432673670415267", 1),
//     ]),
//   ]
//     |> builtin.serialise_data
//     |> bytearray.to_hex

//   True
// }
