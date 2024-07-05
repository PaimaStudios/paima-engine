
import 'dotenv/config';
import { Command, Option } from '@commander-js/extra-typings';
import { mint_token } from './actions.js';
import { api_blockfrost } from './util.js';
import { generateSeedPhrase } from "lucid-cardano";
import fs from 'fs';

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

// App Command: Mint -----------------------------------------------------------
// Executes the mint action
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

    // Try to execute the TX
    try {
      const tx_info = await mint_token(lucid)
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
