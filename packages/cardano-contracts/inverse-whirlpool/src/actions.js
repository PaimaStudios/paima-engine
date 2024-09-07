"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update_token = exports.burn_token = exports.mint_token = exports.create_account = exports.init_merkle = void 0;
var metadata_json_1 = require("./metadata.json");
var sdk_1 = require("@blaze-cardano/sdk");
var util_js_1 = require("./util.js");
var plutus = require("./plutus.ts");
var fs_1 = require("fs");
var merkle_patricia_forestry_1 = require("@aiken-lang/merkle-patricia-forestry");
var blake2b_1 = require("blake2b");
var core_1 = require("@blaze-cardano/core");
var VERBOSE = true;
// #############################################################################
// ## MINT MERKLE INIT
// #############################################################################
var init_merkle = function (API) { return __awaiter(void 0, void 0, void 0, function () {
    var userAddress, utxos_user, utxo, paramScript_Merkle_Minter, address, policyId_Merkle_Minter, mintRedeemer, scriptDatum, quantity_token, asset_token, tx, signedTx, txHash;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // Contract Initialization ---------------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Parameterizing Contracts");
                }
                return [4 /*yield*/, API.wallet.address()];
            case 1:
                userAddress = _a.sent();
                if (VERBOSE) {
                    console.log({
                        "User Address": userAddress,
                        "Network": API.network
                    });
                }
                return [4 /*yield*/, API.wallet.getUnspentOutputs()];
            case 2:
                utxos_user = _a.sent();
                utxo = utxos_user[0];
                paramScript_Merkle_Minter = new plutus.WhirlMerkle({
                    initRef: { transactionId: utxo.input().transactionId, outputIndex: utxo.input().index }
                });
                fs_1.default.writeFileSync('data/param_script.json', JSON.stringify({ 'validator': paramScript_Merkle_Minter.toCbor() }), { encoding: 'utf-8' });
                address = sdk_1.Core.addressFromValidator(core_1.NetworkId.Testnet, paramScript_Merkle_Minter);
                policyId_Merkle_Minter = paramScript_Merkle_Minter.hash();
                // Define Sacrificial Token Information --------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Defining Sacrificial and Primary Asset");
                }
                ;
                // Configure Script Datum and Redeemer ----------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Configuring Datum");
                }
                mintRedeemer = Data.to('InitMerkle', plutus.WhirlMerkle.rdmr);
                scriptDatum = Data.to({
                    Merkle: {
                        root: "0000000000000000000000000000000000000000000000000000000000000000",
                        ownHash: policyId_Merkle_Minter
                    }
                }, plutus.WhirlMerkle.datum);
                quantity_token = 1;
                asset_token = "".concat(policyId_Merkle_Minter).concat("");
                // Build the Second TX -------------------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Building the TX");
                }
                return [4 /*yield*/, API.newTransaction()
                        .lockAssets(address, (0, sdk_1.makeValue)(0, [asset_token, 1n]), scriptDatum)
                        .addMint((0, core_1.PolicyId)(policyId_Merkle_Minter), new Map([[(0, core_1.AssetId)(''), 1n]]), mintRedeemer)
                        .provideScript(paramScript_Merkle_Minter)
                        .addInput(utxo)
                        .complete()];
            case 3:
                tx = _a.sent();
                // if (VERBOSE) { console.log("INFO: Raw TX", tx.toString()); }
                // Request User Signature ----------------------------------------------------
                console.log("INFO: Requesting TX signature");
                return [4 /*yield*/, API.signTransaction(tx)];
            case 4:
                signedTx = _a.sent();
                // Submit the TX -------------------------------------------------------------
                console.log("INFO: Attempting to submit the transaction");
                return [4 /*yield*/, API.submitTransaction(tx)];
            case 5:
                txHash = _a.sent();
                if (!txHash) {
                    console.log("There was a change to the script's metadata");
                }
                else {
                    console.log("TX Hash Submitted: ".concat(txHash));
                }
                // Return with TX hash -------------------------------------------------------
                return [2 /*return*/, {
                        tx_id: txHash,
                        address: address,
                        policy_id: policyId_Merkle_Minter,
                    }];
        }
    });
}); };
exports.init_merkle = init_merkle;
// #############################################################################
// ## MINT MERKLE INIT
// #############################################################################
var create_account = function (API, Validator_Merkle_Minter) { return __awaiter(void 0, void 0, void 0, function () {
    var userAddress, paymentCredentialHash, Address_Contract_Merkle_Minter, policyId_Merkle_Minter, asset_token_root, quantity_token_root, scriptUtxos, assetCollateralTokenUTXO, output_index, account, accountSerialized, accountHashed, merkle_tree, merkle_tree_hash, merkle_tree_proof, merkle_tree_proof_hex, mintRedeemer, spendRedeemer, scriptDatum_SpendRoot, asset_token_account, quantity_token_account, tx, signedTx, txHash, txSuccess;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                // Contract Initialization ---------------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Parameterizing Contracts");
                }
                return [4 /*yield*/, API.wallet.address()];
            case 1:
                userAddress = _d.sent();
                if (VERBOSE) {
                    console.log({
                        "User Address": userAddress,
                        "Network": API.network
                    });
                }
                paymentCredentialHash = paymentCredentialOf(userAddress).hash;
                Address_Contract_Merkle_Minter = API.utils.validatorToAddress(Validator_Merkle_Minter);
                policyId_Merkle_Minter = API.utils.validatorToScriptHash(Validator_Merkle_Minter);
                // Configure Script Datum and Redeemer ----------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Configuring Datum");
                }
                asset_token_root = "".concat(policyId_Merkle_Minter).concat("");
                quantity_token_root = 1;
                return [4 /*yield*/, API.utxosAt(Address_Contract_Merkle_Minter)];
            case 2:
                scriptUtxos = _d.sent();
                assetCollateralTokenUTXO = scriptUtxos.filter(function (object) {
                    return Object.keys(object.assets).includes(asset_token_root);
                });
                console.log("Contract Token in at UTXO:", assetCollateralTokenUTXO);
                console.log("Output index:", assetCollateralTokenUTXO[0].outputIndex);
                output_index = BigInt(assetCollateralTokenUTXO[0].outputIndex);
                console.log('pkh', paymentCredentialHash);
                account = Data.to(new Constr(1, [
                    new Constr(0, [paymentCredentialHash]), BigInt(1)
                ]));
                accountSerialized = Data.to(new Constr(0, [paymentCredentialHash]));
                accountHashed = (0, blake2b_1.default)(32).update(fromHex(accountSerialized)).digest('hex');
                console.log('Serialized Account:', accountSerialized);
                console.log('Blake2b Account Hash:', accountHashed);
                return [4 /*yield*/, new merkle_patricia_forestry_1.Trie(new merkle_patricia_forestry_1.Store('data/merkle_forest_db'))];
            case 3:
                merkle_tree = _d.sent();
                return [4 /*yield*/, merkle_tree.insert(accountHashed, accountHashed)];
            case 4:
                _d.sent();
                //merkle_tree = await merkle_tree.insert("abc", "def");
                // await merkle_tree.save()
                console.log('Merkle Tree:', merkle_tree);
                return [4 /*yield*/, merkle_tree.hash];
            case 5:
                merkle_tree_hash = _d.sent();
                return [4 /*yield*/, merkle_tree.prove(accountHashed)];
            case 6:
                merkle_tree_proof = _d.sent();
                return [4 /*yield*/, merkle_tree_proof.toCBOR().toString('hex')];
            case 7:
                merkle_tree_proof_hex = _d.sent();
                console.log('merkle_tree_proof_hex', merkle_tree_proof_hex);
                console.log('Merkle Tree Info:', {
                    'merkle_proof_hash': toHex(merkle_tree_hash),
                });
                console.log('Redeemer Parameters:', {
                    'account': paymentCredentialHash,
                    'merkle_tree_proof': merkle_tree_proof_hex,
                    'output_index': output_index
                });
                mintRedeemer = Data.to(new Constr(1, [new Constr(0, [paymentCredentialHash]), Data.from(merkle_tree_proof_hex), output_index]));
                spendRedeemer = Data.to(new Constr(1, [new Constr(0, [])]));
                console.log('Mint Redeemer:', mintRedeemer);
                console.log('Spend Redeemer:', spendRedeemer);
                scriptDatum_SpendRoot = Data.to(new Constr(0, [toHex(merkle_tree_hash), policyId_Merkle_Minter]));
                asset_token_account = "".concat(policyId_Merkle_Minter).concat(accountHashed);
                quantity_token_account = 1;
                // Build the Second TX -------------------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Building the TX");
                }
                return [4 /*yield*/, API.newTx()
                        .payToContract(Address_Contract_Merkle_Minter, { inline: scriptDatum_SpendRoot }, (_a = {}, _a[asset_token_root] = BigInt(quantity_token_root), _a))
                        .payToContract(Address_Contract_Merkle_Minter, { inline: account }, (_b = {}, _b[asset_token_account] = BigInt(quantity_token_account), _b))
                        .mintAssets((_c = {}, _c[asset_token_account] = BigInt(quantity_token_account), _c), mintRedeemer)
                        .attachMintingPolicy(Validator_Merkle_Minter)
                        .collectFrom(assetCollateralTokenUTXO, spendRedeemer)
                        .attachSpendingValidator(Validator_Merkle_Minter)
                        .addSigner(userAddress)
                        .complete()];
            case 8:
                tx = _d.sent();
                if (VERBOSE) {
                    console.log("INFO: Raw TX", tx.toString());
                }
                // Request User Signature ----------------------------------------------------
                console.log("INFO: Requesting TX signature");
                return [4 /*yield*/, tx.sign().complete()];
            case 9:
                signedTx = _d.sent();
                // Submit the TX -------------------------------------------------------------
                console.log("INFO: Attempting to submit the transaction");
                return [4 /*yield*/, signedTx.submit()];
            case 10:
                txHash = _d.sent();
                if (!!txHash) return [3 /*break*/, 11];
                console.log("There was a change to the script's metadata");
                return [3 /*break*/, 13];
            case 11:
                console.log("TX Hash Submitted: ".concat(txHash));
                return [4 /*yield*/, lucid.awaitTx(txHash)];
            case 12:
                txSuccess = _d.sent();
                if (txSuccess) {
                    console.log("TX Settled on Chain");
                }
                _d.label = 13;
            case 13: 
            // Return with TX hash -------------------------------------------------------
            return [2 /*return*/, {
                    tx_id: txHash,
                    address: Address_Contract_Merkle_Minter,
                    policy_id: policyId_Merkle_Minter,
                }];
        }
    });
}); };
exports.create_account = create_account;
// #############################################################################
// ## MINT TOKEN
// #############################################################################
var mint_token = function (API, Validators, Validator_Merkle_Minter) { return __awaiter(void 0, void 0, void 0, function () {
    var userAddress, Validator_AlwaysTrue, Validator_Metadata_Minter, Address_Contract_Merkle_Minter, Address_Contract_Metadata_Minter, policyId_Always_True, policyId_Merkle_Minter, policyId_Metadata_Minter, mintRedeemer1, scriptDatumStructure, scriptDatum, script_data_hash, quantity_token, asset_token, utxos_contract, utxo, outputReference, input_ref, metadata_obj, metadata_hash, tx_body, mintRedeemer2, tx, signedTx, txHash, txSuccess;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                // Contract Initialization ---------------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Parameterizing Contracts");
                }
                return [4 /*yield*/, API.wallet.address()];
            case 1:
                userAddress = _c.sent();
                if (VERBOSE) {
                    console.log({
                        "User Address": userAddress,
                        "Network": API.network
                    });
                }
                Validator_AlwaysTrue = { type: "PlutusV2", script: Validators.AlwaysTrue.script };
                Validator_Metadata_Minter = { type: "PlutusV2", script: Validators.Metadata_Minter.script };
                Address_Contract_Merkle_Minter = API.utils.validatorToAddress(Validator_Merkle_Minter);
                Address_Contract_Metadata_Minter = API.utils.validatorToAddress(Validator_Metadata_Minter);
                policyId_Always_True = API.utils.validatorToScriptHash(Validator_AlwaysTrue);
                policyId_Merkle_Minter = API.utils.validatorToScriptHash(Validator_Merkle_Minter);
                policyId_Metadata_Minter = API.utils.validatorToScriptHash(Validator_Metadata_Minter);
                if (VERBOSE) {
                    console.log({
                        "Contract Address - Merkle-Minter:": Address_Contract_Merkle_Minter,
                        "Contract Address - Metadata-Minter:": Address_Contract_Metadata_Minter,
                        "Policy ID - Always True:": policyId_Always_True,
                        "Policy ID - Merkle-Minter:": policyId_Merkle_Minter,
                        "Policy ID - Metadata-Minter:": policyId_Metadata_Minter,
                    });
                }
                // Configure Script Datum and Redeemer ----------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Configuring Datum");
                }
                mintRedeemer1 = Data.to(new Constr(0, []));
                scriptDatumStructure = Data.Object({
                    credential: Data.Bytes,
                    amnt: Data.Integer(),
                });
                scriptDatum = Data.to({ credential: BigInt(1), amnt: BigInt(1) }, scriptDatumStructure);
                if (VERBOSE) {
                    console.log('Pseudo Transaction:', {
                        "Script Datum": scriptDatum,
                        "Redeemer": mintRedeemer1,
                    });
                }
                // Build the First TX --------------------------------------------------------
                // build a tx just to be able to compute what the script data hash will be
                if (VERBOSE) {
                    console.log("INFO: Building psuedo transaction");
                }
                ;
                return [4 /*yield*/, (0, util_js_1.buildPseudoTX)(API, Validator_AlwaysTrue, metadata_json_1.default, scriptDatum)
                    // Define Primary Token Information ------------------------------------------
                ];
            case 2:
                script_data_hash = _c.sent();
                // Define Primary Token Information ------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Defining Asset from Script Data Hash of Pseudo TX");
                }
                ;
                quantity_token = 1;
                asset_token = "".concat(policyId_Metadata_Minter).concat((script_data_hash));
                if (VERBOSE) {
                    console.log('Minting Token:', {
                        "Asset": asset_token,
                        "Quantity": quantity_token,
                    });
                }
                return [4 /*yield*/, API.utxosAt(Address_Contract_Merkle_Minter)
                    // const utxos_base_asset = utxos_user.filter((object) => {
                    //   return Object.keys(object.assets).includes(asset_baseToken);
                    // });
                    //console.log('INFO: UTXOs to select from:',utxos_user)
                ];
            case 3:
                utxos_contract = _c.sent();
                utxo = utxos_contract[0];
                outputReference = {
                    txHash: utxo.txHash,
                    outputIndex: utxo.outputIndex,
                };
                if (VERBOSE) {
                    console.log("UTXO Reference:", outputReference);
                }
                ;
                input_ref = new Constr(0, [
                    new Constr(0, [outputReference.txHash]),
                    BigInt(outputReference.outputIndex),
                ]);
                metadata_obj = Data.fromJson(metadata_json_1.default);
                if (VERBOSE) {
                    console.log("Metadata:", metadata_json_1.default);
                }
                ;
                if (VERBOSE) {
                    console.log("Metadata:", metadata_obj);
                }
                ;
                //const metadata_string = JSON.parse(metadata)
                //if (VERBOSE) { console.log("Metadata:", metadata.toString().getBytes("UTF-8")) };
                //const ListingSchema = Data.Object();
                console.log('Metadata bytes:', Buffer.from(metadata_obj));
                if (VERBOSE) {
                    console.log("Metadata:", Data.castTo(metadata_obj, Data.Bytes));
                }
                ;
                metadata_hash = (0, blake2b_1.default)(32).update(Buffer.from(metadata_obj)).digest('hex');
                console.log('Metadata hash:', metadata_hash);
                tx_body = new Constr(0, [metadata_hash, collateral_inputs, collateral_output, collateral_fee]);
                mintRedeemer2 = Data.to(new Constr(0, [input_ref, tx_body, metadata_bytes]));
                if (VERBOSE) {
                    console.log("INFO: scriptDataHash (to be used as assetName):", script_data_hash);
                }
                // Build the Second TX -------------------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Building the Secondary TX");
                }
                return [4 /*yield*/, API.newTx()
                        .payToAddressWithData(Address_Contract_Metadata_Minter, { inline: scriptDatum }, {})
                        .payToAddress(userAddress, (_a = {}, _a[asset_token] = BigInt(quantity_token), _a))
                        .mintAssets((_b = {}, _b[asset_token] = BigInt(quantity_token), _b), mintRedeemer2)
                        .attachMintingPolicy(Validator_Metadata_Minter)
                        .attachMetadata(721n, metadata_json_1.default)
                        .addSigner(userAddress)
                        .complete()];
            case 4:
                tx = _c.sent();
                if (VERBOSE) {
                    console.log("INFO: Raw TX", tx.toString());
                }
                // Request User Signature ----------------------------------------------------
                console.log("INFO: Requesting TX signature");
                return [4 /*yield*/, tx.sign().complete()];
            case 5:
                signedTx = _c.sent();
                // Submit the TX -------------------------------------------------------------
                console.log("INFO: Attempting to submit the transaction");
                return [4 /*yield*/, signedTx.submit()];
            case 6:
                txHash = _c.sent();
                if (!!txHash) return [3 /*break*/, 7];
                console.log("There was a change to the script's metadata");
                return [3 /*break*/, 9];
            case 7:
                console.log("TX Hash Submitted: ".concat(txHash));
                return [4 /*yield*/, lucid.awaitTx(txHash)];
            case 8:
                txSuccess = _c.sent();
                if (txSuccess) {
                    console.log("TX Settled on Chain");
                }
                _c.label = 9;
            case 9: 
            // Return with TX hash -------------------------------------------------------
            return [2 /*return*/, {
                    tx_id: txHash,
                    address: Address_Contract_Metadata_Minter,
                    policy_id: policyId_Metadata_Minter,
                }];
        }
    });
}); };
exports.mint_token = mint_token;
// #############################################################################
// ## Burn TOKEN
// #############################################################################
var burn_token = function (API) { return __awaiter(void 0, void 0, void 0, function () {
    var userAddress, Validator_AlwaysTrue, Validator_Metadata_Minter, Address_Contract_Metadata_Minter, policyId_Metadata_Minter, mintRedeemer, scriptDatumStructure, scriptDatum, script_data_hash, quantity_token, asset_token, tx, signedTx, txHash, txSuccess;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                // Contract Initialization ---------------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Parameterizing Contracts");
                }
                return [4 /*yield*/, API.wallet.address()];
            case 1:
                userAddress = _b.sent();
                if (VERBOSE) {
                    console.log({
                        "User Address": userAddress,
                        "Network": API.network
                    });
                }
                Validator_AlwaysTrue = { type: "PlutusV2", script: Validators.AlwaysTrue.script };
                Validator_Metadata_Minter = { type: "PlutusV2", script: Validators.Metadata_Minter.script };
                Address_Contract_Metadata_Minter = API.utils.validatorToAddress(Validator_Metadata_Minter);
                policyId_Metadata_Minter = API.utils.validatorToScriptHash(Validator_Metadata_Minter);
                // Define Sacrificial Token Information --------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Defining Sacrificial and Primary Asset");
                }
                ;
                // Configure Script Datum and Redeemer ----------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Configuring Datum");
                }
                mintRedeemer = Data.to(new Constr(1, []));
                scriptDatumStructure = Data.Object({
                    credential: Data.Bytes,
                    amnt: Data.Integer(),
                });
                scriptDatum = Data.to({ credential: BigInt(1), amnt: BigInt(1) }, scriptDatumStructure);
                return [4 /*yield*/, (0, util_js_1.buildPseudoTX)(API, Validator_AlwaysTrue, metadata_json_1.default, scriptDatum)
                    // Define Primary Token Information ------------------------------------------
                ];
            case 2:
                script_data_hash = _b.sent();
                // Define Primary Token Information ------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Defining Sacrificial and Primary Asset");
                }
                ;
                quantity_token = 1;
                asset_token = "".concat(policyId_Metadata_Minter).concat((script_data_hash));
                if (VERBOSE) {
                    console.log("INFO: scriptDataHash (to be used as assetName):", script_data_hash);
                }
                // Build the Second TX -------------------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Building the Secondary TX");
                }
                return [4 /*yield*/, API.newTx()
                        .mintAssets((_a = {}, _a[asset_token] = BigInt(-quantity_token), _a), mintRedeemer)
                        .attachMintingPolicy(Validator_Metadata_Minter)
                        .addSigner(userAddress)
                        .complete()];
            case 3:
                tx = _b.sent();
                if (VERBOSE) {
                    console.log("INFO: Raw TX", tx.toString());
                }
                // Request User Signature ----------------------------------------------------
                console.log("INFO: Requesting TX signature");
                return [4 /*yield*/, tx.sign().complete()];
            case 4:
                signedTx = _b.sent();
                // Submit the TX -------------------------------------------------------------
                console.log("INFO: Attempting to submit the transaction");
                return [4 /*yield*/, signedTx.submit()];
            case 5:
                txHash = _b.sent();
                if (!!txHash) return [3 /*break*/, 6];
                console.log("There was an error submitted the TX");
                return [3 /*break*/, 8];
            case 6:
                console.log("TX Hash Submitted: ".concat(txHash));
                return [4 /*yield*/, lucid.awaitTx(txHash)];
            case 7:
                txSuccess = _b.sent();
                if (txSuccess) {
                    console.log("TX Settled on Chain");
                }
                _b.label = 8;
            case 8: 
            // Return with TX hash -------------------------------------------------------
            return [2 /*return*/, {
                    tx_id: txHash,
                    address: Address_Contract_Metadata_Minter,
                    policy_id: policyId_Metadata_Minter,
                }];
        }
    });
}); };
exports.burn_token = burn_token;
// #############################################################################
// ## Update TOKEN
// #############################################################################
var update_token = function (API) { return __awaiter(void 0, void 0, void 0, function () {
    var userAddress, Validator_AlwaysTrue, Validator_Merkle_Minter, Address_Contract_Merkle_Minter, policyId_Merkle_Minter, mintRedeemer, scriptDatumStructure, scriptDatum, script_data_hash, quantity_token, asset_token, tx, signedTx, txHash, txSuccess;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                // Contract Initialization ---------------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Parameterizing Contracts");
                }
                return [4 /*yield*/, API.wallet.address()];
            case 1:
                userAddress = _c.sent();
                if (VERBOSE) {
                    console.log({
                        "User Address": userAddress,
                        "Network": API.network
                    });
                }
                Validator_AlwaysTrue = { type: "PlutusV2", script: Validators.AlwaysTrue.script };
                Validator_Merkle_Minter = { type: "PlutusV2", script: Validators.Merkle_Minter.script };
                Address_Contract_Merkle_Minter = API.utils.validatorToAddress(Validator_Merkle_Minter);
                policyId_Merkle_Minter = API.utils.validatorToScriptHash(Validator_Merkle_Minter);
                // Define Sacrificial Token Information --------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Defining Sacrificial and Primary Asset");
                }
                ;
                // Configure Script Datum and Redeemer ----------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Configuring Datum");
                }
                mintRedeemer = Data.to(new Constr(0, []));
                scriptDatumStructure = Data.Object({
                    credential: Data.Bytes,
                    amnt: Data.Integer(),
                });
                scriptDatum = Data.to({ credential: BigInt(1), amnt: BigInt(1) }, scriptDatumStructure);
                return [4 /*yield*/, (0, util_js_1.buildPseudoTX)(API, Validator_AlwaysTrue, metadata_json_1.default, scriptDatum)
                    // Define Primary Token Information ------------------------------------------
                ];
            case 2:
                script_data_hash = _c.sent();
                // Define Primary Token Information ------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Defining Sacrificial and Primary Asset");
                }
                ;
                quantity_token = 1;
                asset_token = "".concat(policyId_Merkle_Minter).concat((script_data_hash));
                if (VERBOSE) {
                    console.log("INFO: scriptDataHash (to be used as assetName):", script_data_hash);
                }
                // Build the Second TX -------------------------------------------------------
                if (VERBOSE) {
                    console.log("INFO: Building the Secondary TX");
                }
                return [4 /*yield*/, API.newTx()
                        .payToAddressWithData(Address_Contract_Merkle_Minter, { inline: scriptDatum }, {})
                        .payToAddress(userAddress, (_a = {}, _a[asset_token] = BigInt(quantity_token), _a))
                        .mintAssets((_b = {}, _b[asset_token] = BigInt(quantity_token), _b), mintRedeemer)
                        .attachMintingPolicy(Validator_Merkle_Minter)
                        .attachMetadata(721n, metadata_json_1.default)
                        .addSigner(userAddress)
                        .complete()];
            case 3:
                tx = _c.sent();
                if (VERBOSE) {
                    console.log("INFO: Raw TX", tx.toString());
                }
                // Request User Signature ----------------------------------------------------
                console.log("INFO: Requesting TX signature");
                return [4 /*yield*/, tx.sign().complete()];
            case 4:
                signedTx = _c.sent();
                // Submit the TX -------------------------------------------------------------
                console.log("INFO: Attempting to submit the transaction");
                return [4 /*yield*/, signedTx.submit()];
            case 5:
                txHash = _c.sent();
                if (!!txHash) return [3 /*break*/, 6];
                console.log("There was a change to the script's metadata");
                return [3 /*break*/, 8];
            case 6:
                console.log("TX Hash Submitted: ".concat(txHash));
                return [4 /*yield*/, lucid.awaitTx(txHash)];
            case 7:
                txSuccess = _c.sent();
                if (txSuccess) {
                    console.log("TX Settled on Chain");
                }
                _c.label = 8;
            case 8: 
            // Return with TX hash -------------------------------------------------------
            return [2 /*return*/, {
                    tx_id: txHash,
                    address: Address_Contract_Merkle_Minter,
                    policy_id: policyId_Merkle_Minter,
                }];
        }
    });
}); };
exports.update_token = update_token;
