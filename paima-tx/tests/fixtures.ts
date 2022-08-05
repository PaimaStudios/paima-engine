import { execSync } from "child_process";
import Web3 from "web3";

export let web3: Web3;
export let accounts: string[];

export const mochaGlobalSetup = async () => {
    execSync(
        "docker run -p 8545:8545 --rm -d --name=paima-test trufflesuite/ganache-cli:latest"
    );
    await new Promise(resolve => setTimeout(resolve, 5000));
    web3 = new Web3("ws://localhost:8545");
    accounts = await web3.eth.getAccounts();
};

export const mochaGlobalTeardown = async () => {
    execSync("docker stop paima-test");
};
