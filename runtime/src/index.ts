import type {
  ChainFunnel,
  GameStateMachine,
  PaimaRuntimeInitializer,
  ChainData
} from "paima-utils";
import * as fs from "fs/promises";
import { server, startServer } from "./server.js"

import process from "process";
let run = true;
process.on("SIGINT", () => {
  console.log("Caught SIGINT. Waiting for engine to finish processing current block");
  run = false;
});
process.on('exit', (code) => {
  console.log(`Exiting with code: ${code}`);
});

const paimaEngine: PaimaRuntimeInitializer = {
  initialize(chainFunnel, gameStateMachine, gameBackendVersion) {
    return {
      pollingRate: 4,
      chainDataExtensions: [],
      addGET(route, callback) {
        server.get(route, callback)
      },
      addPOST(route, callback) {
        server.post(route, callback)
      },
      setPollingRate(seconds: number) {
        this.pollingRate = seconds
      },
      addExtensions(chainDataExtensions) {
        this.chainDataExtensions = [...this.chainDataExtensions, ...chainDataExtensions]
      },
      async run() {
        this.addGET("/backend_version", async (req, res) => {
          res.status(200).json(gameBackendVersion);
        });
        // pass endpoints to web server and run
        (async () => startServer())();
        runIterativeFunnel(gameStateMachine, chainFunnel, this.pollingRate);
      }
    }
  }
}
async function runIterativeFunnel(gameStateMachine: GameStateMachine, chainFunnel: ChainFunnel, pollingRate: number) {
  while (run) {
    const latestReadBlockHeight = await gameStateMachine.latestBlockHeight();
    console.log(latestReadBlockHeight, "latest read blockheight")
    const latestChainData = await chainFunnel.readData(latestReadBlockHeight + 1) as ChainData[];
    if (!latestChainData || !latestChainData?.length) await delay(pollingRate * 1000);
    else
      for (let block of latestChainData) {
        const s1 = `${Date.now()} - ${block.blockNumber} block read, containing ${block.submittedData.length} pieces of input\n`
        await fs.appendFile("./logs.log", s1)
        if (block.submittedData.length) console.log(block, "block of chain data being processed")
        try {
          await gameStateMachine.process(block);
          const s2 = `${Date.now()} - ${block.blockNumber} OK\n`
          await fs.appendFile("./logs.log", s2)
          // await delay(pollingRate * 1000);
        }
        catch (error) {
          const s3 = `***ERROR***\n${error}\n***\n`;
          await fs.appendFile("./logs.log", s3)
        }
      }
      if (!run) process.exit(0)
  }
}
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default paimaEngine