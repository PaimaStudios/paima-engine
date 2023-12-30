import type { HardhatUserConfig } from 'hardhat/config';
import { task } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
import '@nomicfoundation/hardhat-toolbox';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'process';

const rl = createInterface({ input: stdin, output: stdout });

const config: HardhatUserConfig = {
  solidity: '0.8.19',
};

export default config;

task('balance', `Prints an account's balance`)
  .addOptionalParam('account', `The account's address`)
  .setAction(async (taskArgs, hre) => {
    console.log(JSON.stringify(taskArgs));
    const account: string =
      taskArgs.account != null ? taskArgs.account : await rl.question('Contract address? ');

    const accounts = await hre.ethers.getSigners();
    const account0 = accounts[0];
    // let privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    // let wallet = new hre.ethers.Wallet(privateKey, hre.network.provider);

    const MyContract = await hre.ethers.getContractFactory('Nft', account0);

    // Connect to the deployed contract
    const myContract = MyContract.attach(account);
    const newOwner = account; // TODO: replace
    const tx = await myContract.transferOwnership(newOwner);
    await tx.wait();

    // Fetch the updated value for confirmation
    const updatedValue = await myContract.owner();
    console.log(`The updated value of myVariable is: ${updatedValue}`);

    rl.close();
  });
