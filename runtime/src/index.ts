import type {
  ChainFunnel,
  GameStateMachine,
  PaimaRuntimeInitializer,
  ChainData
} from "paima-utils";
import * as fs from "fs/promises";
import { exec } from "child_process";
import { server, startServer } from "./server.js"
const SNAPSHOT_INTERVAL = 151200;


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
        const nextSnapshot = await snapshots();
        this.addGET("/backend_version", async (req, res) => {
          res.status(200).json(gameBackendVersion);
        });
        // pass endpoints to web server and run
        (async () => startServer())();
        runIterativeFunnel(gameStateMachine, chainFunnel, this.pollingRate, nextSnapshot);
      }
    }
  }
}

async function snapshots() {
  const dir = "snapshots"
  try {
    const files = await fs.readdir(dir);
    if (files.length === 0) return SNAPSHOT_INTERVAL
    const stats = files.map(async (f) => {
      const s = await fs.stat(dir + "/" + f);
      return {name: f, stats: s}
    })
    const ss = await Promise.all(stats);
    ss.sort((a, b) => a.stats.mtime.getTime() - b.stats.mtime.getTime())
    if (ss.length > 2) await fs.rm(dir + "/" + ss[0].name);
    const maxnum = ss[ss.length -1].name.match(/\d/);
    const max = maxnum?.[0] || "0"
    return parseInt(max) + SNAPSHOT_INTERVAL
  } catch {
    await fs.mkdir(dir);
    return SNAPSHOT_INTERVAL
  }
}
async function runIterativeFunnel(gameStateMachine: GameStateMachine, chainFunnel: ChainFunnel, pollingRate: number, snapshotTrigger: number) {
  while (true) {
    const latestReadBlockHeight = await gameStateMachine.latestBlockHeight();
    console.log(latestReadBlockHeight, "latest read blockheight")
    // take DB snapshot first
    if (latestReadBlockHeight === snapshotTrigger) await saveSnapshot(latestReadBlockHeight);
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
  }
}
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function saveSnapshot(blockHeight: number) {
  const username = process.env.DB_USER;
  const database = process.env.DB_NAME;
  const fileName = `paima-snapshot-${blockHeight}.tar`;
  exec(`pg_dump -U ${username} -d ${database} -f ./snapshots/${fileName} -F t`,)
}

export default paimaEngine