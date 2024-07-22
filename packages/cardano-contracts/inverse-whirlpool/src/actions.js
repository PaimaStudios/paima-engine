import contract from "../plutus.json" assert {type: 'json'};
import metadata from "./metadata.json" assert {type: 'json'};
import {getValidators, buildPseudoTX} from "./util.js";

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
  const Address_Contract_Merkle_Minter = API.utils.validatorToAddress(Validator_Merkle_Minter);

  // Policy IDs
  const policyId_Merkle_Minter = API.utils.validatorToScriptHash(Validator_Merkle_Minter)
  
  // Define Sacrificial Token Information --------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };

  // Configure Script Datum and Redeemer ----------------------------------------
  if (VERBOSE) { console.log("INFO: Configuring Datum"); }

  // Mint Action: InitMerkle (ref: validation.ak)
  const mintRedeemer = Data.to(
    new Constr(0, [])
  ); 
  const scriptDatumStructure = Data.Object({
    credential: Data.Bytes,
    amnt: Data.Integer(),
  })
  const scriptDatum = Data.to({credential: BigInt(1), amnt: BigInt(1)}, scriptDatumStructure)

  // Build the First TX --------------------------------------------------------
  // build a tx just to be able to compute what the script data hash will be
  const script_data_hash = await buildPseudoTX(API, Validator_AlwaysTrue, metadata, scriptDatum)

  // Define Primary Token Information ------------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };

  // Token 2 - Token with scriptDataHash as the asset name
  const quantity_token = 1 
  const asset_token = `${policyId_Merkle_Minter}${(script_data_hash)}`
  
  if (VERBOSE) { console.log("INFO: scriptDataHash (to be used as assetName):", script_data_hash); }

  // Build the Second TX -------------------------------------------------------
  if (VERBOSE) { console.log("INFO: Building the Secondary TX"); }
  const tx = await API.newTx()
    .payToAddressWithData(
      Address_Contract_Merkle_Minter, 
      {inline: scriptDatum},
      {},
    ) 
    .payToAddress(
      userAddress, 
      {[asset_token]: BigInt(quantity_token)},
    ) 
    .mintAssets({[asset_token]: BigInt(quantity_token)}, mintRedeemer)
    .attachMintingPolicy(Validator_Merkle_Minter)
    .attachMetadata(721n, metadata)
    .addSigner(userAddress)
    .complete();
  if (VERBOSE) { console.log("INFO: Raw TX", tx.toString()); }

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
    address: Address_Contract_Merkle_Minter,
    policy_id: policyId_Merkle_Minter,
  };
}

// #############################################################################
// ## Burn TOKEN
// #############################################################################
export const burn_token = async (API) => {

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
  const Address_Contract_Merkle_Minter = API.utils.validatorToAddress(Validator_Merkle_Minter);

  // Policy IDs
  const policyId_Merkle_Minter = API.utils.validatorToScriptHash(Validator_Merkle_Minter)
  
  // Define Sacrificial Token Information --------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };

  // Configure Script Datum and Redeemer ----------------------------------------
  if (VERBOSE) { console.log("INFO: Configuring Datum"); }

  // Mint Action: BurnAccount (ref: validation.ak)
  const mintRedeemer = Data.to(
    new Constr(2, [])
  ); 

  const scriptDatumStructure = Data.Object({
    credential: Data.Bytes,
    amnt: Data.Integer(),
  })
  const scriptDatum = Data.to({credential: BigInt(1), amnt: BigInt(1)}, scriptDatumStructure)

  // Build the First TX --------------------------------------------------------
  // build a tx just to be able to compute what the script data hash will be
  const script_data_hash = await buildPseudoTX(API, Validator_AlwaysTrue, metadata, scriptDatum)

  // Define Primary Token Information ------------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };

  // Token 2 - Token with scriptDataHash as the asset name
  const quantity_token = 1 
  const asset_token = `${policyId_Merkle_Minter}${(script_data_hash)}`
  
  if (VERBOSE) { console.log("INFO: scriptDataHash (to be used as assetName):", script_data_hash); }

  // Build the Second TX -------------------------------------------------------
  if (VERBOSE) { console.log("INFO: Building the Secondary TX"); }
  const tx = await API.newTx()
    .mintAssets({[asset_token]: BigInt(-quantity_token)}, mintRedeemer)
    .attachMintingPolicy(Validator_Merkle_Minter)
    .addSigner(userAddress)
    .complete();
  if (VERBOSE) { console.log("INFO: Raw TX", tx.toString()); }

  // Request User Signature ----------------------------------------------------
  console.log("INFO: Requesting TX signature");
  const signedTx = await tx.sign().complete();

  // Submit the TX -------------------------------------------------------------
  console.log("INFO: Attempting to submit the transaction");
  const txHash = await signedTx.submit();

  if (!txHash) {
    console.log("There was an error submitted the TX")
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
// ## Update TOKEN
// #############################################################################
export const update_token = async (API) => {

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
  const Address_Contract_Merkle_Minter = API.utils.validatorToAddress(Validator_Merkle_Minter);

  // Policy IDs
  const policyId_Merkle_Minter = API.utils.validatorToScriptHash(Validator_Merkle_Minter)
  
  // Define Sacrificial Token Information --------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };

  // Configure Script Datum and Redeemer ----------------------------------------
  if (VERBOSE) { console.log("INFO: Configuring Datum"); }

  // Mint Action: InitMerkle (ref: validation.ak)
  const mintRedeemer = Data.to(
    new Constr(0, [])
  ); 
  const scriptDatumStructure = Data.Object({
    credential: Data.Bytes,
    amnt: Data.Integer(),
  })
  const scriptDatum = Data.to({credential: BigInt(1), amnt: BigInt(1)}, scriptDatumStructure)

  // Build the First TX --------------------------------------------------------
  // build a tx just to be able to compute what the script data hash will be
  const script_data_hash = await buildPseudoTX(API, Validator_AlwaysTrue, metadata, scriptDatum)

  // Define Primary Token Information ------------------------------------------
  if (VERBOSE) { console.log("INFO: Defining Sacrificial and Primary Asset") };

  // Token 2 - Token with scriptDataHash as the asset name
  const quantity_token = 1 
  const asset_token = `${policyId_Merkle_Minter}${(script_data_hash)}`
  
  if (VERBOSE) { console.log("INFO: scriptDataHash (to be used as assetName):", script_data_hash); }

  // Build the Second TX -------------------------------------------------------
  if (VERBOSE) { console.log("INFO: Building the Secondary TX"); }
  const tx = await API.newTx()
    .payToAddressWithData(
      Address_Contract_Merkle_Minter, 
      {inline: scriptDatum},
      {},
    ) 
    .payToAddress(
      userAddress, 
      {[asset_token]: BigInt(quantity_token)},
    ) 
    .mintAssets({[asset_token]: BigInt(quantity_token)}, mintRedeemer)
    .attachMintingPolicy(Validator_Merkle_Minter)
    .attachMetadata(721n, metadata)
    .addSigner(userAddress)
    .complete();
  if (VERBOSE) { console.log("INFO: Raw TX", tx.toString()); }

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
    address: Address_Contract_Merkle_Minter,
    policy_id: policyId_Merkle_Minter,
  };
}