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
require("dotenv/config");
//import contract from "../plutus.json" assert {type: 'json'};
var sdk_1 = require("@blaze-cardano/sdk");
var extra_typings_1 = require("@commander-js/extra-typings");
var actions_js_1 = require("./actions.js");
var util_js_1 = require("./util.js");
var lucid_cardano_1 = require("lucid-cardano");
var fs_1 = require("fs");
// Config: Flags ---------------------------------------------------------------
// Network
var previewOption = new extra_typings_1.Option('-p, --preview', 'Use testnet').default(true);
// Provider
var kupoUrlOption = new extra_typings_1.Option('-k, --kupo-url <string>', 'Kupo URL')
    .env('KUPO_URL')
    .makeOptionMandatory(false);
var ogmiosUrlOption = new extra_typings_1.Option('-o, --ogmios-url <string>', 'Ogmios URL')
    .env('OGMIOS_URL')
    .makeOptionMandatory(false);
var blockfrostUrlOption = new extra_typings_1.Option('-b, --blockfrost-url <string>', 'Blockfrost URL')
    .env('BLOCKFROST_URL')
    .makeOptionMandatory(false);
var utxoRPCOption = new extra_typings_1.Option('-u, --utxorpc-url <string>', 'UTXORPC URL')
    .env('UTXORPC_URL')
    .makeOptionMandatory(false);
var utxoRPCOptionKey = new extra_typings_1.Option('-k, --utxorpc-key <string>', 'UTXORPC KEY')
    .env('UTXORPC_KEY')
    .makeOptionMandatory(false);
// Extra
var txHash = new extra_typings_1.Option('-tx, --tx-hash', 'Transaction Hash')
    .env('tx_hash')
    .makeOptionMandatory(false);
// App -------------------------------------------------------------------------
var app = new extra_typings_1.Command();
app.name('minter').description('Inverse Whirlpool Minter').version('0.0.1');
// App Command: Init -----------------------------------------------------------
app
    .command('init_contract')
    .description('Initializes Contract')
    .addOption(previewOption) // Network
    .addOption(utxoRPCOption) // Provider Option
    .addOption(utxoRPCOptionKey) // Provider Option
    .action(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var provider, mnemonic, entropy, masterkey, wallet, blaze, tx_info, e_1;
    var preview = _b.preview, utxorpcUrl = _b.utxorpcUrl, utxorpcKey = _b.utxorpcKey;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                provider = new sdk_1.U5C({
                    url: utxorpcUrl,
                    headers: {
                        "dmtr-api-key": utxorpcKey
                    }
                });
                console.log('Loading Wallet');
                mnemonic = fs_1.default.readFileSync('seed.txt', { encoding: 'utf-8' });
                entropy = sdk_1.Core.mnemonicToEntropy(mnemonic, sdk_1.Core.wordlist);
                masterkey = sdk_1.Core.Bip32PrivateKey.fromBip39Entropy(Buffer.from(entropy), "");
                return [4 /*yield*/, sdk_1.HotWallet.fromMasterkey(masterkey.hex(), provider)];
            case 1:
                wallet = _c.sent();
                return [4 /*yield*/, sdk_1.Blaze.from(provider, wallet)];
            case 2:
                blaze = _c.sent();
                _c.label = 3;
            case 3:
                _c.trys.push([3, 5, , 6]);
                return [4 /*yield*/, (0, actions_js_1.init_merkle)(blaze)];
            case 4:
                tx_info = _c.sent();
                return [3 /*break*/, 6];
            case 5:
                e_1 = _c.sent();
                console.log(e_1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// App Command: Create Account -----------------------------------------------------------
app
    .command('create_account')
    .description('Creates an Account')
    .addOption(previewOption) // Network
    .addOption(blockfrostUrlOption) // Provider Option
    .addOption(kupoUrlOption) // Provider Option
    .addOption(ogmiosUrlOption) // Provider Option
    .action(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var lucid, parameterized_validator, e_2, tx_info, e_3;
    var preview = _b.preview;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, (0, util_js_1.api_blockfrost)(preview ? 'Preview' : 'Mainnet')];
            case 1:
                lucid = _c.sent();
                return [4 /*yield*/, lucid.selectWalletFromSeed(fs_1.default.readFileSync('seed.txt', { encoding: 'utf-8' }))];
            case 2:
                _c.sent();
                _c.label = 3;
            case 3:
                _c.trys.push([3, 5, , 6]);
                return [4 /*yield*/, JSON.parse(fs_1.default.readFileSync('./data/param_script.json', { encoding: 'utf-8' }))];
            case 4:
                parameterized_validator = _c.sent();
                return [3 /*break*/, 6];
            case 5:
                e_2 = _c.sent();
                console.log(e_2);
                console.log("No parameterized script in src/data found. Make sure to initialize the contract with init_contract first");
                return [3 /*break*/, 6];
            case 6:
                _c.trys.push([6, 8, , 9]);
                return [4 /*yield*/, (0, actions_js_1.create_account)(lucid, parameterized_validator)];
            case 7:
                tx_info = _c.sent();
                return [3 /*break*/, 9];
            case 8:
                e_3 = _c.sent();
                console.log(e_3);
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// App Command: Mint -----------------------------------------------------------
app
    .command('mint')
    .description('Mints a token with a verifiable metadata hash')
    .addOption(previewOption) // Network
    .addOption(blockfrostUrlOption) // Provider Option
    .addOption(kupoUrlOption) // Provider Option
    .addOption(ogmiosUrlOption) // Provider Option
    .action(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var Validators, contract, parameterized_validator, e_4, lucid, tx_info, e_5;
    var preview = _b.preview;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                try {
                    contract = JSON.parse(fs_1.default.readFileSync('../plutus.json', { encoding: 'utf-8' }));
                    Validators = (0, util_js_1.getValidators)(contracts, contract);
                }
                catch (e) {
                    console.log(e);
                    console.log("No contract script found, ensure you've compiled the aiken code.");
                    return [2 /*return*/];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, JSON.parse(fs_1.default.readFileSync('./data/param_script.json', { encoding: 'utf-8' }))];
            case 2:
                parameterized_validator = _c.sent();
                return [3 /*break*/, 4];
            case 3:
                e_4 = _c.sent();
                console.log(e_4);
                console.log("No parameterized script in src/data found. Make sure to initialize the contract with init_contract first");
                return [3 /*break*/, 4];
            case 4: return [4 /*yield*/, (0, util_js_1.api_blockfrost)(preview ? 'Preview' : 'Mainnet')];
            case 5:
                lucid = _c.sent();
                return [4 /*yield*/, lucid.selectWalletFromSeed(fs_1.default.readFileSync('seed.txt', { encoding: 'utf-8' }))];
            case 6:
                _c.sent();
                _c.label = 7;
            case 7:
                _c.trys.push([7, 9, , 10]);
                return [4 /*yield*/, (0, actions_js_1.mint_token)(lucid, Validators, parameterized_validator)];
            case 8:
                tx_info = _c.sent();
                return [3 /*break*/, 10];
            case 9:
                e_5 = _c.sent();
                console.log(e_5);
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); });
// App Command: Burn -----------------------------------------------------------
app
    .command('burn')
    .description('Burns a token')
    .addOption(previewOption) // Network
    .addOption(blockfrostUrlOption) // Provider Option
    .addOption(kupoUrlOption) // Provider Option
    .addOption(ogmiosUrlOption) // Provider Option
    .action(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var lucid, tx_info, e_6;
    var preview = _b.preview;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, (0, util_js_1.api_blockfrost)(preview ? 'Preview' : 'Mainnet')];
            case 1:
                lucid = _c.sent();
                return [4 /*yield*/, lucid.selectWalletFromSeed(fs_1.default.readFileSync('seed.txt', { encoding: 'utf-8' }))];
            case 2:
                _c.sent();
                _c.label = 3;
            case 3:
                _c.trys.push([3, 5, , 6]);
                return [4 /*yield*/, (0, actions_js_1.burn_token)(lucid)];
            case 4:
                tx_info = _c.sent();
                return [3 /*break*/, 6];
            case 5:
                e_6 = _c.sent();
                console.log(e_6);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// App Command: Update -----------------------------------------------------------
app
    .command('update')
    .description("Updates a token's metadata")
    .addOption(previewOption) // Network
    .addOption(blockfrostUrlOption) // Provider Option
    .addOption(kupoUrlOption) // Provider Option
    .addOption(ogmiosUrlOption) // Provider Option
    .action(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var lucid, tx_info, e_7;
    var preview = _b.preview;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, (0, util_js_1.api_blockfrost)(preview ? 'Preview' : 'Mainnet')];
            case 1:
                lucid = _c.sent();
                return [4 /*yield*/, lucid.selectWalletFromSeed(fs_1.default.readFileSync('seed.txt', { encoding: 'utf-8' }))];
            case 2:
                _c.sent();
                _c.label = 3;
            case 3:
                _c.trys.push([3, 5, , 6]);
                return [4 /*yield*/, (0, actions_js_1.update_token)(lucid)];
            case 4:
                tx_info = _c.sent();
                return [3 /*break*/, 6];
            case 5:
                e_7 = _c.sent();
                console.log(e_7);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// App Command: Watches for TX Settlement ----------------------------------------------
app
    .command('checkTX')
    .addOption(previewOption) // Network
    .addOption(blockfrostUrlOption) // Provider Option
    .addOption(kupoUrlOption) // Provider Option
    .addOption(ogmiosUrlOption) // Provider Option
    .addOption(txHash) // Transaction Hash
    .description('Waits for a TX to settle on the blockchain')
    .action(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var lucid;
    var options = _b.options, preview = _b.preview;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                // Set up wallet API and provider API to broadcast the built TX
                // const provider = new Kupmios(kupoUrl, ogmiosUrl);
                console.log('Option info: ', txHash);
                console.log('Awaiting transaction settlement for hash: ', options);
                return [4 /*yield*/, (0, util_js_1.api_blockfrost)(preview ? 'Preview' : 'Mainnet')
                    //const txSuccess = await lucid.awaitTx(txHash)
                ];
            case 1:
                lucid = _c.sent();
                return [2 /*return*/];
        }
    });
}); });
// App Command: Initialize Wallet ----------------------------------------------
// Generates a new wallet
app
    .command('init')
    .description('Initialize a minting ')
    .action(function () {
    console.log("Generating seed phrase...");
    var seed = (0, lucid_cardano_1.generateSeedPhrase)();
    fs_1.default.writeFileSync('seed.txt', seed, { encoding: 'utf-8' });
    console.log("Minting wallet initialized and saved to seed.txt");
    console.log("For testnet faucet, visit: https://docs.cardano.org/cardano-testnets/tools/faucet/");
});
app.parse();
