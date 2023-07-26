/* eslint-disable no-console */
import { ENV } from '@paima/utils';
import { readdir, readFile } from 'fs/promises';
import type { Pool } from 'pg';

export class DataMigrations {
  private static pool: Pool;
  protected static pendingMigrations: number[] = [];
  private static readonly migrationPath = `${process.cwd()}/packaged/migrations/`;

  public static async loadDataMigrations(startBlock: number): Promise<number> {
    try {
      const files = await readdir(this.migrationPath);
      // Only process files named as : 1000.sql, 301904.sql, etc.
      DataMigrations.pendingMigrations = files
        // Filter by file name [number].sql
        .filter(f => f.match(/^\d+\.sql$/))
        // Get numeric prefix
        .map(f => f.match(/^(\d+)\.sql$/)?.[1])
        // Transform to number and offset
        .map(f => parseInt((f as string), 10))
        // Check if migraton block height is in the future
        .filter(f => f + ENV.START_BLOCKHEIGHT > startBlock);

      if (DataMigrations.pendingMigrations.length > 0) {
        DataMigrations.pendingMigrations.sort((a, b) => a - b); // sort asc
        console.log('Loaded Migrations:');
        DataMigrations.pendingMigrations.forEach(x =>
          console.log(`${x}.sql running in ${x - (startBlock - ENV.START_BLOCKHEIGHT)} blocks`)
        );
      }
    } catch (e) {
      if (!String(e).match(/ENOENT/)) {
        throw e; // if error not "director not found" throw error.
      }
    }
    return DataMigrations.pendingMigrations.length;
  }

  public static setDBConnection(pool: Pool): void {
    DataMigrations.pool = pool;
  }

  public static hasPendingMigration(currentBlock: number): boolean {
    if (DataMigrations.pendingMigrations.length === 0) return false;
    // We need only to check the first, pendingMigrations are sorted first to last.
    return DataMigrations.pendingMigrations[0] + ENV.START_BLOCKHEIGHT === currentBlock;
  }

  public static async applyDataDBMigrations(currentBlock: number): Promise<void> {
    // check if migration within
    if (DataMigrations.pendingMigrations[0] + ENV.START_BLOCKHEIGHT !== currentBlock) {
      throw new Error('No data migration to apply at: ' + currentBlock);
    }
    const migration = DataMigrations.pendingMigrations.shift();
    console.log(`Applying Data Migration ${migration}.sql`);
    const sqlQueries = await readFile(`${this.migrationPath}/${migration}.sql`, 'utf-8');
    await DataMigrations.pool.query(sqlQueries);
    return;
  }
}
