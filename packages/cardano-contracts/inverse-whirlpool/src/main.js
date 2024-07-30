
import 'dotenv/config';
//import contract from "../plutus.json" assert {type: 'json'};
import { Command, Option } from '@commander-js/extra-typings';
import { mint_token, burn_token, update_token, init_merkle, create_account } from './actions.js';
import { api_blockfrost, getValidators } from './util.js';
import { generateSeedPhrase } from "lucid-cardano";
import fs from 'fs';

// Config: Contracts
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

// Config: Option Flags --------------------------------------------------------
const kupoUrlOption = new Option('-k, --kupo-url <string>', 'Kupo URL')
  .env('KUPO_URL')
  .makeOptionMandatory(false);
const ogmiosUrlOption = new Option('-o, --ogmios-url <string>', 'Ogmios URL')
  .env('OGMIOS_URL')
  .makeOptionMandatory(false);
const blockfrostUrlOption = new Option('-b, --blockfrost-url <string>', 'Blockfrost URL')
  .env('BLOCKFROST_URL')
  .makeOptionMandatory(false);
const previewOption = new Option('-p, --preview', 'Use testnet').default(true);

// App -------------------------------------------------------------------------
const app = new Command();
app.name('minter').description('Inverse Whirlpool Minter').version('0.0.1');

// App Command: Init -----------------------------------------------------------
app
  .command('init_contract')
  .description('Initializes Contract')
  .addOption(previewOption)            // Network
  .addOption(blockfrostUrlOption)      // Provider Option
  .addOption(kupoUrlOption)            // Provider Option
  .addOption(ogmiosUrlOption)          // Provider Option
  .action(async ({ preview }) => {

    // Set up wallet API and provider API to broadcast the built TX
    // const provider = new Kupmios(kupoUrl, ogmiosUrl);
    const lucid = await api_blockfrost(preview ? 'Preview' : 'Mainnet' )
    await lucid.selectWalletFromSeed(fs.readFileSync('seed.txt', { encoding: 'utf-8' }));

    // Try to the the built contract code
    let Validators;
    try {
      const contract = JSON.parse(fs.readFileSync('../plutus.json',{ encoding: 'utf-8' }));
      Validators = getValidators(contracts, contract);
    } catch (e) {
      console.log(e);
      console.log("No contract script found, ensure you've compiled the aiken code.");
      return
    }

    // Try to execute the TX
    try {
      const tx_info = await init_merkle(lucid, Validators)
    } catch (e) {
      console.log(e);
    }
  });

// App Command: Init -----------------------------------------------------------
app
  .command('create_account')
  .description('Creates an Account')
  .addOption(previewOption)            // Network
  .addOption(blockfrostUrlOption)      // Provider Option
  .addOption(kupoUrlOption)            // Provider Option
  .addOption(ogmiosUrlOption)          // Provider Option
  .action(async ({ preview }) => {

    // Set up wallet API and provider API to broadcast the built TX
    // const provider = new Kupmios(kupoUrl, ogmiosUrl);
    const lucid = await api_blockfrost(preview ? 'Preview' : 'Mainnet' )
    await lucid.selectWalletFromSeed(fs.readFileSync('seed.txt', { encoding: 'utf-8' }));

    // Try to the parameterized contract code
    let parameterized_validator;
    try {
      parameterized_validator = await JSON.parse(fs.readFileSync('./data/param_script.json',{ encoding: 'utf-8' }));

      console.log(parameterized_validator);
    } catch (e) {
      console.log(e);
      console.log("No parameterized script in src/data found. Make sure to initialize the contract with init_contract first");
    }
    // Try to execute the TX
    try {
      const tx_info = await create_account(lucid, parameterized_validator)
    } catch (e) {
      console.log(e);
    }
  });

// App Command: Mint -----------------------------------------------------------
app
  .command('mint')
  .description('Mints a token with a verifiable metadata hash')
  .addOption(previewOption)            // Network
  .addOption(blockfrostUrlOption)      // Provider Option
  .addOption(kupoUrlOption)            // Provider Option
  .addOption(ogmiosUrlOption)          // Provider Option
  .action(async ({ preview }) => {

    // Set up wallet API and provider API to broadcast the built TX
    // const provider = new Kupmios(kupoUrl, ogmiosUrl);
    const lucid = await api_blockfrost(preview ? 'Preview' : 'Mainnet' )
    await lucid.selectWalletFromSeed(fs.readFileSync('seed.txt', { encoding: 'utf-8' }));
   
    console.log(lucid)
    // Initialize Lucid ----------------------------------------------------------

    // Try to execute the TX
    try {
      const tx_info = await mint_token(lucid)
    } catch (e) {
      console.log(e);
    }
  });

// App Command: Burn -----------------------------------------------------------
app
  .command('burn')
  .description('Burns a token')
  .addOption(previewOption)            // Network
  .addOption(blockfrostUrlOption)      // Provider Option
  .addOption(kupoUrlOption)            // Provider Option
  .addOption(ogmiosUrlOption)          // Provider Option
  .action(async ({ preview }) => {

    // Set up wallet API and provider API to broadcast the built TX
    // const provider = new Kupmios(kupoUrl, ogmiosUrl);
    const lucid = await api_blockfrost(preview ? 'Preview' : 'Mainnet' )
    await lucid.selectWalletFromSeed(fs.readFileSync('seed.txt', { encoding: 'utf-8' }));

    // Try to execute the TX
    try {
      const tx_info = await burn_token(lucid)
    } catch (e) {
      console.log(e);
    }
  });


// App Command: Update -----------------------------------------------------------
app
  .command('update')
  .description("Updates a token's metadata")
  .addOption(previewOption)            // Network
  .addOption(blockfrostUrlOption)      // Provider Option
  .addOption(kupoUrlOption)            // Provider Option
  .addOption(ogmiosUrlOption)          // Provider Option
  .action(async ({ preview }) => {

    // Set up wallet API and provider API to broadcast the built TX
    // const provider = new Kupmios(kupoUrl, ogmiosUrl);
    const lucid = await api_blockfrost(preview ? 'Preview' : 'Mainnet' )
    await lucid.selectWalletFromSeed(fs.readFileSync('seed.txt', { encoding: 'utf-8' }));

    // Try to execute the TX
    try {
      const tx_info = await update_token(lucid)
    } catch (e) {
      console.log(e);
    }
  });

// App Command: Initialize Wallet ----------------------------------------------
// Generates a new wallet
app
  .command('init')
  .description('Initialize a minting ')
  .action(() => {

    console.log(`Generating seed phrase...`);
    const seed = generateSeedPhrase();

    fs.writeFileSync('seed.txt', seed, { encoding: 'utf-8' });

    console.log(`Minting wallet initialized and saved to seed.txt`);  
    console.log(`For testnet faucet, visit: https://docs.cardano.org/cardano-testnets/tools/faucet/`);
  });

app.parse();
