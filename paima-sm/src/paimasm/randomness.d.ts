import pg from "pg";
export declare function randomnessRouter(n: number): typeof getSeed1;
declare function getSeed1(latestChainData: any, DBConn: pg.Pool): Promise<string>;
export {};
