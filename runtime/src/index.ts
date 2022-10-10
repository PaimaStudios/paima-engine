import * as fs from "fs/promises";
import type {
    ChainData,
    ChainFunnel,
    GameStateMachine,
    PaimaRuntimeInitializer,
} from "paima-utils";
import { doLog, logError, logSuccess } from "paima-utils";
import process from "process";
import { server, startServer } from "./server.js";
import { snapshotIfTime } from "./snapshots.js";
let run = true;

process.on("SIGINT", () => {
    doLog(
        "Caught SIGINT. Waiting for engine to finish processing current block"
    );
    run = false;
});

process.on("SIGTERM", () => {
    doLog(
        "Caught SIGTERM. Waiting for engine to finish processing current block"
    );
    run = false;
});

process.on("exit", code => {
    doLog(`Exiting with code: ${code}`);
});

const paimaEngine: PaimaRuntimeInitializer = {
    initialize(chainFunnel, gameStateMachine, gameBackendVersion) {
        // initialize snapshot folder
        return {
            pollingRate: 4,
            chainDataExtensions: [],
            addGET(route, callback) {
                server.get(route, callback);
            },
            addPOST(route, callback) {
                server.post(route, callback);
            },
            setPollingRate(seconds: number) {
                this.pollingRate = seconds;
            },
            addExtensions(chainDataExtensions) {
                this.chainDataExtensions = [
                    ...this.chainDataExtensions,
                    ...chainDataExtensions,
                ];
            },
            async run() {
                const finalBlockHeight = await getFinalBlockHeight();
                doLog(`Final block height set to ${finalBlockHeight}`);
                this.addGET("/backend_version", async (req, res) => {
                    res.status(200).json(gameBackendVersion);
                });
                // pass endpoints to web server and run
                (async () => startServer())();
                runIterativeFunnel(
                    gameStateMachine,
                    chainFunnel,
                    this.pollingRate,
                    finalBlockHeight
                );
            },
        };
    },
};

async function getFinalBlockHeight(): Promise<number | null> {
    let finalBlockHeight: number | null = null;
    try {
        finalBlockHeight = await fs
            .readFile("./stopBlockHeight.conf", "utf8")
            .then(data => {
                if (!/^\d+\s*$/.test(data)) {
                    doLog(`Improperly formatted stopBlockHeight.conf: +${data}+`);
                    throw new Error();
                }
                return parseInt(data, 10);
            });
    } catch (err) {
        // file doesn't exist or is invalid, finalBlockHeight remains null
        doLog("Something went wrong while reading stopBlockHeight.conf.");
        if (typeof err === "object" && err !== null && err.hasOwnProperty("message")) {
          const e = err as { message: string };
          doLog(`Error message: ${e.message}`);
        }
        await logError(err);
    }
    return finalBlockHeight;
}

async function loopIfStopBlockReached(
    latestReadBlockHeight: number,
    finalBlockHeight: number | null
) {
    if (finalBlockHeight !== null && latestReadBlockHeight >= finalBlockHeight) {
      while (run) {
        await delay(2000);
      }
      process.exit(0);
    }
}

async function runIterativeFunnel(
    gameStateMachine: GameStateMachine,
    chainFunnel: ChainFunnel,
    pollingRate: number,
    finalBlockHeight: number | null
) {
    while (run) {
        const latestReadBlockHeight =
            await gameStateMachine.latestBlockHeight();
        await snapshotIfTime(latestReadBlockHeight);
        await loopIfStopBlockReached(
            latestReadBlockHeight,
            finalBlockHeight
        );

        // Read latest chain data from funnel
        const latestChainDataList = (await chainFunnel.readData(
            latestReadBlockHeight + 1
        )) as ChainData[];
        doLog(
            `Received chain data from Paima Funnel. Total count: ${latestChainDataList.length}`
        );
        // Checking if should safely close after fetching all chain data
        // which may take some time
        if (!run) {
            process.exit(0);
        }

        if (!latestChainDataList || !latestChainDataList?.length) {
            console.log(`No chain data was returned, waiting ${pollingRate}s.`);
            await delay(pollingRate * 1000);
            continue;
        }

        for (let block of latestChainDataList) {
            // Checking if should safely close in between processing blocks
            if (!run) {
                process.exit(0);
            }
            // await logBlock(block);
            try {
                await gameStateMachine.process(block);
                await logSuccess(block);
                if (!run) {
                    process.exit(0);
                }
            } catch (error) {
                await logError(error);
            }

            const latestReadBlockHeight = await gameStateMachine.latestBlockHeight();
            await snapshotIfTime(latestReadBlockHeight);
            await loopIfStopBlockReached(
                latestReadBlockHeight,
                finalBlockHeight
            );    
        }
    }
    process.exit(0);
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default paimaEngine;
