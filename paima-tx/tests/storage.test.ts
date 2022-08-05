import { expect } from "chai";
import { isAddress } from "web3-utils";
import {
    getStorageDeploymentTxTemplate,
    getStoreDataTxTemplate,
    readData,
    subscribeToNewData,
} from "../src";
import { accounts, web3 } from "./fixtures";

describe("Storage tests", function () {
    const nodeUrl = "ws://localhost:8545";
    let storageAddress: string;
    let blockNumber: number;

    it("usable storage contract deployment transaction template is returned", async function () {
        const deploymentTxTemplate = getStorageDeploymentTxTemplate();

        const gas = await web3.eth.estimateGas(deploymentTxTemplate);
        const deploymentTx = {
            ...deploymentTxTemplate,
            from: accounts[0],
            gas: gas,
        };
        const res = await web3.eth.sendTransaction(deploymentTx);
        expect(res.status).to.be.true;
        expect(isAddress(res.contractAddress)).to.be.true;
        storageAddress = res.contractAddress;
    });

    it("usable data storing transaction template is returned", async function () {
        const data = Buffer.from("beef", "hex");
        const storeDataTxTemplate = getStoreDataTxTemplate(
            storageAddress,
            data
        );

        let storeDataTx: any = {
            ...storeDataTxTemplate,
            from: accounts[0],
        };
        const gas = await web3.eth.estimateGas(storeDataTx);
        storeDataTx = { ...storeDataTx, gas: gas };
        const res = await web3.eth.sendTransaction(storeDataTx);
        expect(res.status).to.be.true;
        expect(res.logs).to.not.be.empty;
        blockNumber = res.blockNumber;
    });

    it("stored data can be read", async function () {
        const foundData = await readData(
            nodeUrl,
            storageAddress,
            blockNumber,
            blockNumber
        );
        expect(foundData.length).to.equal(1);
        expect(foundData[0].submittedData).to.deep.equal([
            {
                userAddress: accounts[0],
                data: Buffer.from("beef", "hex"),
            },
        ]);
    });

    it("user can subscribe to new blocks", async function () {
        let blocks = [];
        const cb = function (error, result) {
            expect(error).to.be.undefined;
            blocks.push(result);
        };
        subscribeToNewData(nodeUrl, storageAddress, cb);

        // this makes ganache mine a block
        await web3.eth.sendTransaction({
            from: accounts[0],
            to: accounts[1],
            value: "1000000",
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        // the subscription must have kicked in
        expect(blocks).to.not.be.empty;
    });
});
