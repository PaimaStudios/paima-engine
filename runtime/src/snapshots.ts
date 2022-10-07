import * as fs from "fs/promises";

import { exec } from "child_process";
import { doLog } from "paima-utils";

const SNAPSHOT_INTERVAL = 43200;

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

async function saveSnapshot(blockHeight: number) {
  const username = process.env.DB_USER;
  const password = process.env.DB_PW;
  const database = process.env.DB_NAME;
  const host = process.env.DB_HOST;
  const fileName = `paima-snapshot-${blockHeight}.sql`;
  doLog(`Attempting to save snapshot: ${fileName}`)
  exec(`pg_dump --dbname=postgresql://${username}:${password}@${host}:5432/${database} -f ./snapshots/${fileName}`,)
}

export async function snapshotIfTime(latestReadBlockHeight: number) {
  const snapshotTrigger = await snapshots(latestReadBlockHeight);
  if (latestReadBlockHeight >= snapshotTrigger) await saveSnapshot(latestReadBlockHeight);
}