import type {
  ChainFunnel,
  GameStateMachine,
  PaimaRuntimeInitializer,
  ChainData,
} from "paima-utils";
import { doLog, logBlock, logSuccess, logError } from "paima-utils";
import * as fs from "fs/promises";
import { exec } from "child_process";
import { server, startServer } from "./server.js"
import process from "process";

const SNAPSHOT_INTERVAL = 43200;
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

async function snapshots(blockheight: number) {
  const dir = "snapshots"
  try {
    const files = await fs.readdir(dir);
    if (files.length === 0) {
      const filename = `paima-snapshot-dummy-${blockheight}.tar`
      fs.writeFile(`./snapshots/${filename}`, "")
      return blockheight + SNAPSHOT_INTERVAL
    }
    const stats = files.map(async (f) => {
      const s = await fs.stat(dir + "/" + f);
      return { name: f, stats: s }
    })
    const ss = await Promise.all(stats);
    ss.sort((a, b) => a.stats.mtime.getTime() - b.stats.mtime.getTime())
    if (ss.length > 2) await fs.rm(dir + "/" + ss[0].name);
    const maxnum = ss[ss.length - 1].name.match(/\d+/);
    const max = maxnum?.[0] || "0"
    return parseInt(max) + SNAPSHOT_INTERVAL
  } catch {
    await fs.mkdir(dir);
    return SNAPSHOT_INTERVAL
  }
}

async function runIterativeFunnel(gameStateMachine: GameStateMachine, chainFunnel: ChainFunnel, pollingRate: number, finalBlockHeight: number | null) {
  while (run) {
    const latestReadBlockHeight = await gameStateMachine.latestBlockHeight();
    // Take DB snapshot
    const snapshotTrigger = await snapshots(latestReadBlockHeight);
    if (latestReadBlockHeight >= snapshotTrigger) await saveSnapshot(latestReadBlockHeight);
    // Stop if final block height was reached:
    if (finalBlockHeight !== null && latestReadBlockHeight >= finalBlockHeight) {
      run = false;
      return;
    }

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
        // Pass to PaimaSM
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
  process.exit(0);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function saveSnapshot(blockHeight: number) {
  const username = process.env.DB_USER;
  const password = process.env.DB_PW;
  const database = process.env.DB_NAME;
  const host = process.env.DB_HOST;
  const fileName = `paima-snapshot-${blockHeight}.sql`;
  doLog(`Attempting to save snapshot: ${fileName}`)
  exec(`pg_dump --dbname=postgresql://${username}:${password}@${host}:5432/${database} -f ./snapshots/${fileName}`,)
}

export default paimaEngine


