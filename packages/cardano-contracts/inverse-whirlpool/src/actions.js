import contract from "../plutus.json" assert {type: 'json'};
import { getValidators} from "./util.js";

import {
  Data,
  fromText,
  Constr,
} from "lucid-cardano";

const VERBOSE = true;

const contracts = [
  { 
    alias: 'AlwaysTrue',
    validator: 'true.mint',
  },
  { 
    alias: 'Merkle_Minter',
    validator: 'whirl.merkle_minter',
  },
  { 
    alias: 'Metadata_Minter',
    validator: 'whirl.mint',
  },
];
const Validators = getValidators(contracts, contract);

// #############################################################################
// ## MINT TOKEN
// #############################################################################
export const mint_token = async (API) => {

  // Contract Initialization ---------------------------------------------------
  if (VERBOSE) { console.log("INFO: Parameterizing Contracts"); }

  // User Address
  const userAddress = await API.wallet.address()
  if (VERBOSE) { 
    console.log({
      "User Address": userAddress,
      "Network": API.network
    })
  }

  // Mint Validators
  const Validator_AlwaysTrue = {type: "PlutusV2", script: Validators.AlwaysTrue.script };
  const Validator_Merkle_Minter = {type: "PlutusV2", script: Validators.Merkle_Minter.script };

  // Contract Addresses
  const Address_Contract_AlwaysTrue = API.utils.validatorToAddress(Validator_AlwaysTrue);
  const Address_Contract_Merkle_Minter = API.utils.validatorToAddress(Validator_Merkle_Minter);

  // Policy IDs
  const policyId_AlwaysTrue = API.utils.validatorToScriptHash(Validator_AlwaysTrue)
  const policyId_Merkle_Minter = API.utils.validatorToScriptHash(Validator_Merkle_Minter)
  
  // Define Sacrificial Token Information --------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };

  // Token 1 - Sacrificial token
  const assetName_token1 = "SomeTokenName"
  const quantity_token1 = 1 
  const asset_token1 = `${policyId_AlwaysTrue}${fromText(assetName_token1)}`

  // Token Metadata
  const metaDatum = {
    name: "Some Name",
    description: "Testing this contract.",
  };

  // Configure Script Datum and Redeemer ----------------------------------------
  if (VERBOSE) { console.log("INFO: Configuring Datum"); }

  // Mint Action: AssetCollateral -> Mint
  const mintRedeemer = Data.to(
    new Constr(0, [])
  ); 
  const scriptDatumStructure = Data.Object({
    credential: Data.Bytes,
    amnt: Data.Integer(),
  })
  const scriptDatum = Data.to({credential: BigInt(1), amnt: BigInt(1)}, scriptDatumStructure)

  // Build the First TX --------------------------------------------------------
  if (VERBOSE) { console.log("INFO: Building the TX"); }
  // build a tx just to be able to compute what the script data hash will be
  const script_data_hash = await (async () => {
    const tx = await API.newTx()
    .payToAddressWithData(
      Address_Contract_AlwaysTrue, 
      {inline: scriptDatum},
      { 
        ['lovelace']: BigInt(1000000),
      },
    ) 
    .payToAddress(
      userAddress, 
      { 
        [asset_token1]: BigInt(quantity_token1)
      },
    ) 
    .mintAssets({[asset_token1]: BigInt(quantity_token1)}, mintRedeemer)
    .attachMintingPolicy(Validator_AlwaysTrue)
    .attachMetadata(721n, metaDatum)
    .addSigner(userAddress)
    .complete();
    if (VERBOSE) { console.log("INFO: Raw TX 1", tx.toString()); }

    return tx.txComplete.body().script_data_hash().to_hex();
  })();

  // Define Primary Token Information ------------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };

  // Token 2 - Token with scriptDataHash as the asset name
  const assetName_token2 = script_data_hash;
  const quantity_token2 = 1 
  const asset_token2 = `${policyId_Merkle_Minter}${(assetName_token2)}`
  
  if (VERBOSE) { console.log("INFO: scriptDataHash (to be used as assetName):", assetName_token2); }

  // Build the Second TX -------------------------------------------------------
  if (VERBOSE) { console.log("INFO: Building the Secondary TX"); }
  const tx2 = await API.newTx()
  .payToAddressWithData(
    Address_Contract_Merkle_Minter, 
    {inline: scriptDatum},
    { 
      ['lovelace']: BigInt(1000000),
    },
  ) 
  .payToAddress(
    userAddress, 
    { 
      [asset_token2]: BigInt(quantity_token2)
    },
  ) 
  .mintAssets({[asset_token2]: BigInt(quantity_token2)}, mintRedeemer)
  .attachMintingPolicy(Validator_Merkle_Minter)
  .attachMetadata(721n, metaDatum)
  .addSigner(userAddress)
  .complete();
  if (VERBOSE) { console.log("INFO: Raw TX 2", tx2.toString()); }

  // Request User Signature ----------------------------------------------------
  console.log("INFO: Requesting TX signature");
  const signedTx = await tx2.sign().complete();

  // Submit the TX -------------------------------------------------------------
  console.log("INFO: Attempting to submit the transaction");
  const txHash = await signedTx.submit();

  if (!txHash) {
    console.log("There was a change to the script's metadata")
  }
   else {
    console.log(`TX Hash Submitted: ${txHash}`);
  }

  // Return with TX hash -------------------------------------------------------
  return {
    tx_id: txHash,
    address: Address_Contract_Merkle_Minter,
    policy_id: policyId_Merkle_Minter,
  };
}

// #############################################################################
// ## Burn TOKEN
// #############################################################################
export const burn_token = async (wallet) => {

  if (VERBOSE) { console.log({
    "wallet": wallet,
    })
  }

  // Initialize Lucid ----------------------------------------------------------
  const lucid = await lucidAPI(wallet)

  // Parameterize Contracts ----------------------------------------------------
  if (VERBOSE) { console.log("INFO: Parameterizing Contracts"); }

  // Mint Validators
  const Validator_Mint = {type: "PlutusV2", script: Validators.Mint.script };

  // Contract Addresses
  const Address_ContractMint = lucid.utils.validatorToAddress(Validator_Mint);

  // Policy IDs
  const policyId_Mint = lucid.utils.validatorToScriptHash(Validator_Mint)
  
  // Define Sacrificial Token Information --------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };

  // Token 1 - Sacrificial token
  const assetName_token = "SomeTokenName"
  const quantity_token = 1 
  const asset_token = `${policyId_Mint}${fromText(assetName_token)}`

  // Token Metadata
  const metaDatum = {
    name: "Some Name",
    description: "Testing this contract.",
  };

  // Configure Script Datum and Redeemer ----------------------------------------
  if (VERBOSE) { console.log("INFO: Configuring Datum"); }

  // Mint Action: AssetCollateral -> Mint
  const mintRedeemer = Data.to(
    new Constr(0, [])
  ); 
  const scriptDatumStructure = Data.Object({
    credential: Data.Bytes,
    amnt: Data.Integer(),
  })
  const scriptDatum = Data.to({credential: BigInt(1), amnt: BigInt(1)}, scriptDatumStructure)

  // Define Primary Token Information ------------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };
  
  if (VERBOSE) { console.log("INFO: scriptDataHash (to be used as assetName):", assetName_token2); }

  // Build the Second TX -------------------------------------------------------
  if (VERBOSE) { console.log("INFO: Building the Secondary TX"); }
  const tx = await lucid.newTx()
  .payToAddressWithData(
    Address_ContractMint, 
    {inline: scriptDatum},
    { 
      ['lovelace']: BigInt(1000000),
    },
  ) 
  .payToAddress(
    wallet.userAddress, 
    { 
      [asset_token]: BigInt(-quantity_token)
    },
  ) 
  .mintAssets({[asset_token]: BigInt(-quantity_token)}, mintRedeemer)
  .attachMintingPolicy(Validator_Merkle_Minter)
  .attachMetadata(721n, metaDatum)
  .addSigner(wallet.userAddress)
  .complete();
  if (VERBOSE) { console.log("INFO: Raw TX 2", tx.toString()); }

  // Request User Signature ----------------------------------------------------
  console.log("INFO: Requesting TX signature");
  const signedTx = await tx.sign().complete();

  // Submit the TX -------------------------------------------------------------
  console.log("INFO: Attempting to submit the transaction");
  const txHash = await signedTx.submit();

  if (!txHash) {
    console.log("There was a change to the script's metadata")
  }
   else {
    console.log(`TX Hash Submitted: ${txHash}`);
  }

  // Return with TX hash -------------------------------------------------------
  return {
    tx_id: txHash,
    address: Address_ContractMint,
    policy_id: policyId_Mint,
  };
}

// #############################################################################
// ## Update TOKEN
// #############################################################################
export const update_token = async (wallet) => {

  if (VERBOSE) { console.log({
    "wallet": wallet,
    })
  }

  // Initialize Lucid ----------------------------------------------------------
  const lucid = await lucidAPI(wallet)

  // Parameterize Contracts ----------------------------------------------------
  if (VERBOSE) { console.log("INFO: Parameterizing Contracts"); }

  // Mint Validators
  const Validator_Mint = {type: "PlutusV2", script: Validators.Mint.script };
  const Validator_Merkle_Minter = {type: "PlutusV2", script: Validators.Mint.script };

  // Contract Addresses
  const Address_ContractMint = lucid.utils.validatorToAddress(Validator_Mint);
  const Address_ContractMerkle_Minter = lucid.utils.validatorToAddress(Validator_Merkle_Minter);

  // Policy IDs
  const policyId_Mint1 = lucid.utils.validatorToScriptHash(Validator_Mint)
  const policyId_Merkle_Minter = lucid.utils.validatorToScriptHash(Validator_Merkle_Minter)
  
  // Define Sacrificial Token Information --------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };

  // Token 1 - Sacrificial token
  const assetName_token1 = "SomeTokenName"
  const quantity_token1 = 1 
  const asset_token1 = `${policyId_Mint1}${fromText(assetName_token1)}`

  // Token Metadata
  const metaDatum = {
    name: "Some Name",
    description: "Testing this contract.",
  };

  // Configure Script Datum and Redeemer ----------------------------------------
  if (VERBOSE) { console.log("INFO: Configuring Datum"); }

  // Mint Action: AssetCollateral -> Mint
  const mintRedeemer = Data.to(
    new Constr(0, [])
  ); 
  const scriptDatumStructure = Data.Object({
    credential: Data.Bytes,
    amnt: Data.Integer(),
  })
  const scriptDatum = Data.to({credential: BigInt(1), amnt: BigInt(1)}, scriptDatumStructure)

  // Build the First TX --------------------------------------------------------
  if (VERBOSE) { console.log("INFO: Building the TX"); }
  // build a tx just to be able to compute what the script data hash will be
  const script_data_hash = await (async () => {
    const tx = await lucid.newTx()
    .payToAddressWithData(
      Address_ContractMint, 
      {inline: scriptDatum},
      { 
        ['lovelace']: BigInt(1000000),
      },
    ) 
    .payToAddress(
      wallet.userAddress, 
      { 
        [asset_token1]: BigInt(quantity_token1)
      },
    ) 
    .mintAssets({[asset_token1]: BigInt(quantity_token1)}, mintRedeemer)
    .attachMintingPolicy(Validator_Mint)
    .attachMetadata(721n, metaDatum)
    .addSigner(wallet.userAddress)
    .complete();
    if (VERBOSE) { console.log("INFO: Raw TX 1", tx.toString()); }

    return tx.txComplete.body().script_data_hash().to_hex();
  })();

  // Define Primary Token Information ------------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };

  // Token 2 - Token with scriptDataHash as the asset name
  const assetName_token2 = script_data_hash;
  const quantity_token2 = 1 
  const asset_token2 = `${policyId_Merkle_Minter}${(assetName_token2)}`
  
  if (VERBOSE) { console.log("INFO: scriptDataHash (to be used as assetName):", assetName_token2); }

  // Build the Second TX -------------------------------------------------------
  if (VERBOSE) { console.log("INFO: Building the Secondary TX"); }
  const tx2 = await lucid.newTx()
  .payToAddressWithData(
    Address_ContractMerkle_Minter, 
    {inline: scriptDatum},
    { 
      ['lovelace']: BigInt(1000000),
    },
  ) 
  .payToAddress(
    wallet.userAddress, 
    { 
      [asset_token2]: BigInt(quantity_token2)
    },
  ) 
  .mintAssets({[asset_token2]: BigInt(quantity_token2)}, mintRedeemer)
  .attachMintingPolicy(Validator_Merkle_Minter)
  .attachMetadata(721n, metaDatum)
  .addSigner(wallet.userAddress)
  .complete();
  if (VERBOSE) { console.log("INFO: Raw TX 2", tx2.toString()); }

  // Request User Signature ----------------------------------------------------
  console.log("INFO: Requesting TX signature");
  const signedTx = await tx2.sign().complete();

  // Submit the TX -------------------------------------------------------------
  console.log("INFO: Attempting to submit the transaction");
  const txHash = await signedTx.submit();

  if (!txHash) {
    console.log("There was a change to the script's metadata")
  }
   else {
    console.log(`TX Hash Submitted: ${txHash}`);
  }

  // Return with TX hash -------------------------------------------------------
  return {
    tx_id: txHash,
    address: Address_ContractMerkle_Minter,
    policy_id: policyId_Merkle_Minter,
  };
}


