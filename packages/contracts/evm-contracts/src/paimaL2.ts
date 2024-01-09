import { task, types } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import { getContract, getOrAskString, ownerCheck, paimaScope } from './common.js';

paimaScope
  .task('PaimaL2Contract:setFee', `Sets the fee of a Paima L2 contract`)
  .addOptionalParam('contract', `The contracts's address`, undefined, types.string)
  .addOptionalParam('fee', `The new fee (wei)`, undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    // Connect to the deployed contract
    const { signer, account } = await getContract(hre, taskArgs.contract);
    const contractFactory = await hre.ethers.getContractFactory('PaimaL2Contract', signer);
    const contract = contractFactory.attach(account);

    ownerCheck(await contract.owner(), await signer.getAddress());

    const newFee = BigInt(await getOrAskString(taskArgs.fee, 'Fee? '));
    if ((await contract.fee()) === newFee) {
      console.log(`Fee matches existing value "${newFee}". Skipping`);
      return;
    }
    const tx = await contract.setFee(newFee);
    await tx.wait();
    const updatedValue = await contract.fee();
    console.log(`The updated value of "fee" is: ${updatedValue}`);
  });
paimaScope
  .task('PaimaL2Contract:setOwner', `Sets the owner of a Paima L2 contract`)
  .addOptionalParam('contract', `The contracts's address`, undefined, types.string)
  .addOptionalParam('owner', `The new owner address`, undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    // Connect to the deployed contract
    const { signer, account } = await getContract(hre, taskArgs.contract);
    const contractFactory = await hre.ethers.getContractFactory('PaimaL2Contract', signer);
    const contract = contractFactory.attach(account);

    ownerCheck(await contract.owner(), await signer.getAddress());

    if ((await contract.owner()) === taskArgs.owner) {
      console.log(`Owner matches existing value "${taskArgs.owner}". Skipping`);
      return;
    }
    const tx = await contract.setOwner(taskArgs.owner);
    await tx.wait();
    const updatedValue = await contract.owner();
    console.log(`The updated value of "owner" is: ${updatedValue}`);
  });

paimaScope
  .task('PaimaL2Contract:withdrawFunds', `Withdraws funds out of the Paima L2 contract`)
  .addOptionalParam('contract', `The contracts's address`, undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    // Connect to the deployed contract
    const { signer, account } = await getContract(hre, taskArgs.contract);
    const contractFactory = await hre.ethers.getContractFactory('PaimaL2Contract', signer);
    const contract = contractFactory.attach(account);

    ownerCheck(await contract.owner(), await signer.getAddress());

    const currentBalance = await hre.ethers.provider.getBalance(account);
    if (currentBalance === 0n) {
      console.log(`Current balance is "${0n}". Skipping`);
      return;
    }
    const tx = await contract.withdrawFunds();
    await tx.wait();
    console.log(`Withdrew ${currentBalance} to ${await signer.getAddress()}`);
  });

paimaScope
  .task('PaimaL2Contract:submitGameInput', `Submit data to the Paima L2 contract`)
  .addOptionalParam('contract', `The contracts's address`, undefined, types.string)
  .addOptionalParam(
    'data',
    `The data to submit either hex-encoded (0x...) or Paima concise-encoded`,
    undefined,
    types.string
  )
  .setAction(async (taskArgs, hre) => {
    // Connect to the deployed contract
    const { signer, account } = await getContract(hre, taskArgs.contract);
    const contractFactory = await hre.ethers.getContractFactory('PaimaL2Contract', signer);
    const contract = contractFactory.attach(account);

    const providedData = await getOrAskString(taskArgs.data, 'data? ');
    const data = providedData.startsWith('0x')
      ? providedData
      : hre.ethers.toUtf8Bytes(providedData);

    const fee = await contract.fee();
    console.log(fee);
    const tx = await contract.paimaSubmitGameInput(data, { value: fee });
    await tx.wait();
    console.log(`Submitted data to the contract successfully at ${tx.hash}`);
  });

paimaScope
  .task('PaimaL2Contract:recentInputs', `Gets data recently submitted to the Paima L2 contract`)
  .addOptionalParam('contract', `The contracts's address`, undefined, types.string)
  .addOptionalParam(
    'data',
    `The data to submit in hex-encoded for (0x...)`,
    undefined,
    types.string
  )
  .addOptionalParam(
    'range',
    `How far back to get events (default: look back 1000 blocks from tip)`,
    undefined,
    types.int
  )
  .setAction(async (taskArgs, hre) => {
    // Connect to the deployed contract
    const { signer, account } = await getContract(hre, taskArgs.contract);
    const contractFactory = await hre.ethers.getContractFactory('PaimaL2Contract', signer);
    const contract = contractFactory.attach(account);

    const toBlock = await hre.ethers.provider.getBlockNumber();
    const fromBlock = toBlock - Math.min(taskArgs.range ?? 10000, toBlock);

    const eventFilter = contract.filters.PaimaGameInteraction();
    const events = await contract.queryFilter(eventFilter, fromBlock, toBlock);

    const getData = (rawData: string): string => {
      const tentativeData: string = hre.ethers.AbiCoder.defaultAbiCoder().decode(
        ['bytes'],
        rawData
      )[0];
      const textBuffer = Buffer.from(tentativeData.substring('0x'.length), 'hex');
      try {
        const decoded = new TextDecoder('utf-8', { fatal: true }).decode(textBuffer);
        // check if ASCII data
        if (/^[\x20-\x7E]*$/.test(decoded)) {
          return decoded;
        }
        // cannot be printed in a terminal
        return tentativeData;
      } catch (e) {
        // not a valid utf8 string
        return tentativeData;
      }
    };

    console.log(
      events.map(event => ({
        blockHash: event.blockHash,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        address: event.address,
        data: getData(event.data),
      }))
    );
  });

task('genDocs', `Generate documentation for tasks of a given scope`)
  .addParam('scope', 'The scope to generate documentation for')
  .setAction(async ({ scope }, hre) => {
    const scopeContent = hre.scopes[scope];
    console.log(scopeContent);

    console.log(`# ${scopeContent.description ?? scope}`);
    console.log(
      `These are all the [hardhat tasks](https://hardhat.org/hardhat-runner/docs/advanced/create-task) available for the scope \`${scope}\`.`
    );
    console.log();
    console.log(`You can call each of these tasks using \`npx hardhat ${scope} task_name\``);
    for (const [name, definition] of Object.entries(scopeContent.tasks)) {
      console.log();
      console.log(`## \`${name}\``);
      console.log(definition.description ?? 'No description provided');
      const parameters = Object.values(definition.paramDefinitions);
      if (parameters.length > 0) {
        console.log();
        console.log('Parameters:');
        for (const param of parameters) {
          let annotations = [];
          if (param.isOptional) {
            annotations.push(`optional`);
            if (param.defaultValue != null) {
              annotations.push(`${param.defaultValue}`);
            }
          }
          if (param.type) {
            annotations.push(`${param.type.name}`);
          }
          const annotationText = annotations.length > 0 ? ` *(${annotations.join(', ')})* ` : '';
          console.log(
            `- **${param.name}**${annotationText}: ${
              param.description ?? 'No description provided'
            }`
          );
        }
      }
    }
  });
