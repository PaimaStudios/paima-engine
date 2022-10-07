import type {
  ChainFunnel,
  GameStateMachine,
  PaimaRuntimeInitializer,
  ChainData,
} from "paima-utils";
import { doLog, logBlock, logSuccess, logError } from "paima-utils";
import * as fs from "fs/promises";
import { server, startServer } from "./server.js"
import process from "process";
import { snapshotIfTime } from "./snapshots.js";
let run = true;

process.on("SIGINT", () => {
  doLog("Caught SIGINT. Waiting for engine to finish processing current block");
  run = false;
});

process.on("SIGTERM", () => {
  doLog("Caught SIGTERM. Waiting for engine to finish processing current block");
  run = false;
});

process.on('exit', (code) => {
  doLog(`Exiting with code: ${code}`);
});


const paimaEngine: PaimaRuntimeInitializer = {
  initialize(chainFunnel, gameStateMachine, gameBackendVersion) {
    // initialize snapshot folder
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
        const finalBlockHeight = await getFinalBlockHeight();
        doLog(`Final block height set to ${finalBlockHeight}`);
        this.addGET("/backend_version", async (req, res) => {
          res.status(200).json(gameBackendVersion);
        });
        // pass endpoints to web server and run
        (async () => startServer())();
        runIterativeFunnel(gameStateMachine, chainFunnel, this.pollingRate, finalBlockHeight);
      }
    }
  }
}

async function getFinalBlockHeight(): Promise<number | null> {
  let finalBlockHeight: number | null = null;
  try {
    finalBlockHeight = await fs.readFile("./stopBlockHeight.conf", "utf8").then((data) => {
      if (!/^\d+\s*$/.test(data)) {
        throw new Error();
      }
      return parseInt(data, 10);
    });
  } catch (err) {
    // file doesn't exist or is invalid, finalBlockHeight remains null
  }
  return finalBlockHeight;
}

function stopBlockReached(latestReadBlockHeight: number, finalBlockHeight: number | null): boolean {
  const result = finalBlockHeight !== null && latestReadBlockHeight >= finalBlockHeight;
  run = !result;
  return result;
}

async function runIterativeFunnel(gameStateMachine: GameStateMachine, chainFunnel: ChainFunnel, pollingRate: number, finalBlockHeight: number | null) {
  while (run) {
    const latestReadBlockHeight = await gameStateMachine.latestBlockHeight();

    // Read latest chain data from funnel
    const latestChainDataList = await chainFunnel.readData(latestReadBlockHeight + 1) as ChainData[];
    doLog(`Received chain data from Paima Funnel. Total count: ${latestChainDataList.length}`);
    // Checking if should safely close after fetching all chain data
    // which may take some time
    if (!run) {
      process.exit(0)
    }

    // If chain data list
    if (!latestChainDataList || !latestChainDataList?.length) {
      console.log(`No chain data was returned, waiting ${pollingRate}s.`)
      await delay(pollingRate * 1000);
    }
    else{
      for (let block of latestChainDataList) {
        // Checking if should safely close in between processing blocks
        if (!run) {
          process.exit(0)
        }
        // await logBlock(block);
        try {
          await gameStateMachine.process(block);
          await logSuccess(block);
          if (!run) {
            process.exit(0)
          }

          const latestReadBlockHeight = await gameStateMachine.latestBlockHeight();
          await snapshotIfTime(latestReadBlockHeight);
          if (stopBlockReached(latestReadBlockHeight, finalBlockHeight)) {
            process.exit(0)
          }
        }
        catch (error) {
          await logError(error)
        }
      }
    }
  }
  process.exit(0);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default paimaEngine