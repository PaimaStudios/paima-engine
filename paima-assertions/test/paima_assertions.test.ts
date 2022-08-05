import { expect } from "chai";

import { PaimaAssertions } from "../src/paima_assertions.js";
import type { ChainData } from "paima-utils";

import TrueProcessor from "./true_processor.js";
import FalseProcessor from "./false_processor.js";

interface Assertions {
    processChainData: (chainData: ChainData) => ChainData
}

function inputsToOutputs(inputs: string[], pa: Assertions): string[] {
    const inputChainData = buildChainData(inputs);
    const outputChainData = pa.processChainData(inputChainData);
    return extractSubmittedStrings(outputChainData);
}

function inputsToNExpectedOutputs(inputs: string[], pa: Assertions, numExpected: number) {
    const outputs = inputsToOutputs(inputs, pa);

    expect(outputs.length).to.equal(numExpected);
    for (let i = 0; i < numExpected; i++) {
        expect(outputs[i]).to.equal(inputs[i]);
    }
}

function buildChainData(submitted: string[]): ChainData {
    return {
        timestamp: 0,
        blockHash: "",
        blockNumber: 0,
        submittedData: submitted.map((s) => ({
            inputData: s,
            userAddress: ""
        }))
    }
}

function extractSubmittedStrings(chainData: ChainData): string[] {
    return chainData.submittedData.map((sd) => sd.inputData);
}

describe("PaimaAssertions tests", function() {
    it("Number of assertions limit works", function() {
        const inputs = [
            "s|10",
            "s|10|n<a>",
            "s|10|n<a>|n<b>",
            "s|10|n<a>|n<b>|n<c>",
            "s|10|n<a>|n<b>|n<c>|n<d>"
        ];

        let pa = PaimaAssertions.initialize(2);
        pa.addAnyProcessor(new TrueProcessor(), "n");

        inputsToNExpectedOutputs(inputs, pa, 3);
    });

    it("Order of assertions is checked", function() {
        const inputs = [
            "s|10",
            "s|10|n<a>",
            "s|10|n<a>|10|n<b>"
        ];

        let pa = PaimaAssertions.initialize(2);
        pa.addAnyProcessor(new TrueProcessor(), "n");

        inputsToNExpectedOutputs(inputs, pa, 2);
    });

    it("Unknown assertions invalidate input", function() {
        const inputs = [
            "s|10",
            "s|10|n<a>",
            "s|10|m<a>",
            "s|10|j<a>"
        ];

        let pa = PaimaAssertions.initialize(2);
        pa.addAnyProcessor(new TrueProcessor(), "n");

        inputsToNExpectedOutputs(inputs, pa, 2);
    });

    it("Angle brackets disallowed outside assertions", function() {
        const inputs = [
            "s|10",
            "s|10|n<a>|n<b>",
            "s|asd>|10|11",
            "s|11e|<31|20",
            "s|>dsa|dsa<|300",
            "s|<e|>c|"
        ];

        let pa = PaimaAssertions.initialize(2);
        pa.addAnyProcessor(new TrueProcessor(), "n");

        inputsToNExpectedOutputs(inputs, pa, 2);
    });

    it("Processors only get applied when assertions are present", function() {
        const inputs = [
            "s|10",
            "s|10|n<a>",
            "s|10|n<b>|n<c>"
        ];

        let pa = PaimaAssertions.initialize(2);
        pa.addAnyProcessor(new FalseProcessor(), "n");

        inputsToNExpectedOutputs(inputs, pa, 1);
    });

    it("Interleaving works", function() {
        const inputs = [
            "s|10",
            "s|10|n<a>|20",
            "s|10|n<a>",
            "s|10|j<a>",
            "s|n<b>|n<c>",
            "s<|10",
        ];

        let pa = PaimaAssertions.initialize(2);
        pa.addAnyProcessor(new TrueProcessor(), "n");

        const outputs = inputsToOutputs(inputs, pa);
    
        const numExpected = 3;
        expect(outputs.length).to.equal(numExpected);
        for (let i = 0; i < numExpected; i++) {
            expect(outputs[i]).to.equal(inputs[i * 2]);
        }
    });
});