import type {
  ChainFunnel,
  GameStateMachine,
  PaimaRuntimeInitializer,
  ChainData
} from "paima-utils";
import * as fs from "fs/promises";
import { server, startServer } from "./server.js"


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
  while (true) {
    const latestReadBlockHeight = await gameStateMachine.latestBlockHeight();
    console.log(latestReadBlockHeight, "latest read blockheight")
    // read data from funnel
    const latestChainData = await chainFunnel.readData(latestReadBlockHeight + 1) as ChainData[];
    // retry later if no data came in
    if (!latestChainData || !latestChainData?.length) await delay(pollingRate * 1000);
    else
      for (let block of latestChainData) {
        await logBlock(block);
        if (block.submittedData.length) console.log(block, "block of chain data being processed")
        try {
          await gameStateMachine.process(block);
          await logSuccess(block)
        }
        catch (error) {
          await logError(error)
        }
      }
  }
}

async function logBlock(block: ChainData) {
  const s1 = `${Date.now()} - ${block.blockNumber} block read, containing ${block.submittedData.length} pieces of input\n`
  console.log(s1)
  await fs.appendFile("./logs.log", s1)
}
async function logSuccess(block: ChainData) {
  const s2 = `${Date.now()} - ${block.blockNumber} OK\n`
  console.log(s2)
  await fs.appendFile("./logs.log", s2)
}
async function logError(error: any) {
  const s3 = `***ERROR***\n${error}\n***\n`;
  console.log(s3)
  await fs.appendFile("./logs.log", s3)
}
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default paimaEngine