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
import { initSnapshots, snapshotIfTime } from "./snapshots.js";
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
                this.addGET("/backend_version", async (req, res) => {
                    res.status(200).json(gameBackendVersion);
                });

                const stopBlockHeight = await getStopBlockHeight();
                doLog(`Final block height set to ${stopBlockHeight}`);

                doLog(`DB_PORT: ${process.env.DB_PORT}`);

                await initSnapshots();

                // pass endpoints to web server and run
                (async () => startServer())();

                runIterativeFunnel(
                    gameStateMachine,
                    chainFunnel,
                    this.pollingRate,
                    stopBlockHeight
                );
            },
        };
    },
};

async function getStopBlockHeight(): Promise<number | null> {
    let stopBlockHeight: number | null = null;
    try {
        stopBlockHeight = await fs
            .readFile("./stopBlockHeight.conf", "utf8")
            .then(data => {
                if (!/^\d+\s*$/.test(data)) {
                    doLog(
                        `Improperly formatted stopBlockHeight.conf: +${data}+`
                    );
                    throw new Error();
                }
                return parseInt(data, 10);
            });
    } catch (err) {
        // file doesn't exist or is invalid, finalBlockHeight remains null
        doLog("Something went wrong while reading stopBlockHeight.conf.");
        if (
            typeof err === "object" &&
            err !== null &&
            err.hasOwnProperty("message")
        ) {
            const e = err as { message: string };
            doLog(`Error message: ${e.message}`);
        }
        await logError(err);
    }
    return stopBlockHeight;
}

async function loopIfStopBlockReached(
    latestReadBlockHeight: number,
    stopBlockHeight: number | null
) {
    if (stopBlockHeight !== null && latestReadBlockHeight >= stopBlockHeight) {
        doLog(`Reached stop block height, stopping the funnel...`);
        while (run) {
            await delay(2000);
        }
        process.exit(0);
    }
}

function exitIfStopped(run: boolean) {
    if (!run) {
        process.exit(0);
    }
}

async function runIterativeFunnel(
    gameStateMachine: GameStateMachine,
    chainFunnel: ChainFunnel,
    pollingRate: number,
    stopBlockHeight: number | null
) {
    while (run) {
        const latestReadBlockHeight =
            await gameStateMachine.latestBlockHeight();
        await snapshotIfTime(latestReadBlockHeight);
        await loopIfStopBlockReached(latestReadBlockHeight, stopBlockHeight);
        exitIfStopped(run);

        // Read latest chain data from funnel
        const latestChainDataList = (await chainFunnel.readData(
            latestReadBlockHeight + 1
        )) as ChainData[];
        doLog(
            `Received chain data from Paima Funnel. Total count: ${latestChainDataList.length}`
        );
        // Checking if should safely close after fetching all chain data
        // which may take some time
        exitIfStopped(run);

        if (!latestChainDataList || !latestChainDataList?.length) {
            console.log(`No chain data was returned, waiting ${pollingRate}s.`);
            await delay(pollingRate * 1000);
            continue;
        }

        for (let block of latestChainDataList) {
            // Checking if should safely close in between processing blocks
            exitIfStopped(run);
            
            try {
                await gameStateMachine.process(block);
                await logSuccess(block);
                exitIfStopped(run);
            } catch (error) {
                await logError(error);
            }

            const latestReadBlockHeight =
                await gameStateMachine.latestBlockHeight();
            await snapshotIfTime(latestReadBlockHeight);
            exitIfStopped(run);
            await loopIfStopBlockReached(
                latestReadBlockHeight,
                stopBlockHeight
            );
        }
    }
    process.exit(0);
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default paimaEngine;
