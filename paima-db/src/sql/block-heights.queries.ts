/** Types generated for queries found in "src/sql/block-heights.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'GetLatestProcessedBlockHeight' parameters type */
export type IGetLatestProcessedBlockHeightParams = void;

/** 'GetLatestProcessedBlockHeight' return type */
export interface IGetLatestProcessedBlockHeightResult {
  block_height: number;
  done: boolean;
  seed: string;
}

/** 'GetLatestProcessedBlockHeight' query type */
export interface IGetLatestProcessedBlockHeightQuery {
  params: IGetLatestProcessedBlockHeightParams;
  result: IGetLatestProcessedBlockHeightResult;
}

const getLatestProcessedBlockHeightIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM block_heights\nWHERE done IS TRUE\nORDER BY block_height DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM block_heights
 * WHERE done IS TRUE
 * ORDER BY block_height DESC
 * LIMIT 1
 * ```
 */
export const getLatestProcessedBlockHeight = new PreparedQuery<IGetLatestProcessedBlockHeightParams,IGetLatestProcessedBlockHeightResult>(getLatestProcessedBlockHeightIR);


/** 'GetBlockSeeds' parameters type */
export type IGetBlockSeedsParams = void;

/** 'GetBlockSeeds' return type */
export interface IGetBlockSeedsResult {
  seed: string;
}

/** 'GetBlockSeeds' query type */
export interface IGetBlockSeedsQuery {
  params: IGetBlockSeedsParams;
  result: IGetBlockSeedsResult;
}

const getBlockSeedsIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT seed FROM block_heights\nWHERE done IS TRUE\nORDER BY block_height DESC\nLIMIT 25"};

/**
 * Query generated from SQL:
 * ```
 * SELECT seed FROM block_heights
 * WHERE done IS TRUE
 * ORDER BY block_height DESC
 * LIMIT 25
 * ```
 */
export const getBlockSeeds = new PreparedQuery<IGetBlockSeedsParams,IGetBlockSeedsResult>(getBlockSeedsIR);


/** 'GetBlockHeight' parameters type */
export interface IGetBlockHeightParams {
  block_height: number | null | void;
}

/** 'GetBlockHeight' return type */
export interface IGetBlockHeightResult {
  block_height: number;
  done: boolean;
  seed: string;
}

/** 'GetBlockHeight' query type */
export interface IGetBlockHeightQuery {
  params: IGetBlockHeightParams;
  result: IGetBlockHeightResult;
}

const getBlockHeightIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":false,"transform":{"type":"scalar"},"locs":[{"a":50,"b":62}]}],"statement":"SELECT * FROM block_heights \nWHERE block_height = :block_height"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM block_heights 
 * WHERE block_height = :block_height
 * ```
 */
export const getBlockHeight = new PreparedQuery<IGetBlockHeightParams,IGetBlockHeightResult>(getBlockHeightIR);


/** 'SaveLastBlockHeight' parameters type */
export interface ISaveLastBlockHeightParams {
  block_height: number;
  seed: string;
}

/** 'SaveLastBlockHeight' return type */
export type ISaveLastBlockHeightResult = void;

/** 'SaveLastBlockHeight' query type */
export interface ISaveLastBlockHeightQuery {
  params: ISaveLastBlockHeightParams;
  result: ISaveLastBlockHeightResult;
}

const saveLastBlockHeightIR: any = {"usedParamSet":{"block_height":true,"seed":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":60,"b":73}]},{"name":"seed","required":true,"transform":{"type":"scalar"},"locs":[{"a":76,"b":81}]}],"statement":"INSERT INTO block_heights(block_height, seed, done)\nVALUES (:block_height!, :seed!, FALSE)\nON CONFLICT (block_height)\nDO UPDATE SET\nblock_height = EXCLUDED.block_height,\nseed = EXCLUDED.seed,\ndone = EXCLUDED.done"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO block_heights(block_height, seed, done)
 * VALUES (:block_height!, :seed!, FALSE)
 * ON CONFLICT (block_height)
 * DO UPDATE SET
 * block_height = EXCLUDED.block_height,
 * seed = EXCLUDED.seed,
 * done = EXCLUDED.done
 * ```
 */
export const saveLastBlockHeight = new PreparedQuery<ISaveLastBlockHeightParams,ISaveLastBlockHeightResult>(saveLastBlockHeightIR);


/** 'BlockHeightDone' parameters type */
export interface IBlockHeightDoneParams {
  block_height: number;
}

/** 'BlockHeightDone' return type */
export type IBlockHeightDoneResult = void;

/** 'BlockHeightDone' query type */
export interface IBlockHeightDoneQuery {
  params: IBlockHeightDoneParams;
  result: IBlockHeightDoneResult;
}

const blockHeightDoneIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":58,"b":71}]}],"statement":"UPDATE block_heights\nSET\ndone = true\nWHERE block_height = :block_height!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE block_heights
 * SET
 * done = true
 * WHERE block_height = :block_height!
 * ```
 */
export const blockHeightDone = new PreparedQuery<IBlockHeightDoneParams,IBlockHeightDoneResult>(blockHeightDoneIR);


