/** Types generated for queries found in "src/sql/queries.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'GetLatestBlockHeight' parameters type */
export type IGetLatestBlockHeightParams = void;

/** 'GetLatestBlockHeight' return type */
export interface IGetLatestBlockHeightResult {
  block_height: number;
  done: boolean;
  seed: string;
}

/** 'GetLatestBlockHeight' query type */
export interface IGetLatestBlockHeightQuery {
  params: IGetLatestBlockHeightParams;
  result: IGetLatestBlockHeightResult;
}

const getLatestBlockHeightIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM block_heights\nWHERE done IS TRUE\nORDER BY block_height DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM block_heights
 * WHERE done IS TRUE
 * ORDER BY block_height DESC
 * LIMIT 1
 * ```
 */
export const getLatestBlockHeight = new PreparedQuery<IGetLatestBlockHeightParams,IGetLatestBlockHeightResult>(getLatestBlockHeightIR);


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

const saveLastBlockHeightIR: any = {"usedParamSet":{"block_height":true,"seed":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":60,"b":73}]},{"name":"seed","required":true,"transform":{"type":"scalar"},"locs":[{"a":76,"b":81}]}],"statement":"INSERT INTO block_heights(block_height, seed, done)\nVALUES (:block_height!, :seed!, FALSE)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO block_heights(block_height, seed, done)
 * VALUES (:block_height!, :seed!, FALSE)
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


/** 'DeleteScheduled' parameters type */
export interface IDeleteScheduledParams {
  id: number;
}

/** 'DeleteScheduled' return type */
export type IDeleteScheduledResult = void;

/** 'DeleteScheduled' query type */
export interface IDeleteScheduledQuery {
  params: IDeleteScheduledParams;
  result: IDeleteScheduledResult;
}

const deleteScheduledIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":38,"b":41}]}],"statement":"DELETE FROM scheduled_data\nWHERE id = :id!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM scheduled_data
 * WHERE id = :id!
 * ```
 */
export const deleteScheduled = new PreparedQuery<IDeleteScheduledParams,IDeleteScheduledResult>(deleteScheduledIR);


/** 'GetScheduledDataByBlockHeight' parameters type */
export interface IGetScheduledDataByBlockHeightParams {
  block_height: number;
}

/** 'GetScheduledDataByBlockHeight' return type */
export interface IGetScheduledDataByBlockHeightResult {
  block_height: number;
  id: number;
  input_data: string;
}

/** 'GetScheduledDataByBlockHeight' query type */
export interface IGetScheduledDataByBlockHeightQuery {
  params: IGetScheduledDataByBlockHeightParams;
  result: IGetScheduledDataByBlockHeightResult;
}

const getScheduledDataByBlockHeightIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":50,"b":63}]}],"statement":"SELECT * from scheduled_data\nWHERE block_height = :block_height!\nORDER BY id ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * from scheduled_data
 * WHERE block_height = :block_height!
 * ORDER BY id ASC
 * ```
 */
export const getScheduledDataByBlockHeight = new PreparedQuery<IGetScheduledDataByBlockHeightParams,IGetScheduledDataByBlockHeightResult>(getScheduledDataByBlockHeightIR);


/** 'FindNonce' parameters type */
export interface IFindNonceParams {
  nonce: string | null | void;
}

/** 'FindNonce' return type */
export interface IFindNonceResult {
  block_height: number;
  nonce: string;
}

/** 'FindNonce' query type */
export interface IFindNonceQuery {
  params: IFindNonceParams;
  result: IFindNonceResult;
}

const findNonceIR: any = {"usedParamSet":{"nonce":true},"params":[{"name":"nonce","required":false,"transform":{"type":"scalar"},"locs":[{"a":35,"b":40}]}],"statement":"SELECT * FROM nonces\nWHERE nonce = :nonce"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM nonces
 * WHERE nonce = :nonce
 * ```
 */
export const findNonce = new PreparedQuery<IFindNonceParams,IFindNonceResult>(findNonceIR);


/** 'DeleteNonces' parameters type */
export interface IDeleteNoncesParams {
  limit_block_height: number;
}

/** 'DeleteNonces' return type */
export type IDeleteNoncesResult = void;

/** 'DeleteNonces' query type */
export interface IDeleteNoncesQuery {
  params: IDeleteNoncesParams;
  result: IDeleteNoncesResult;
}

const deleteNoncesIR: any = {"usedParamSet":{"limit_block_height":true},"params":[{"name":"limit_block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":41,"b":60}]}],"statement":"DELETE FROM nonces\nWHERE block_height <= :limit_block_height!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM nonces
 * WHERE block_height <= :limit_block_height!
 * ```
 */
export const deleteNonces = new PreparedQuery<IDeleteNoncesParams,IDeleteNoncesResult>(deleteNoncesIR);


/** 'InsertNonce' parameters type */
export interface IInsertNonceParams {
  block_height: number;
  nonce: string;
}

/** 'InsertNonce' return type */
export type IInsertNonceResult = void;

/** 'InsertNonce' query type */
export interface IInsertNonceQuery {
  params: IInsertNonceParams;
  result: IInsertNonceResult;
}

const insertNonceIR: any = {"usedParamSet":{"nonce":true,"block_height":true},"params":[{"name":"nonce","required":true,"transform":{"type":"scalar"},"locs":[{"a":48,"b":54}]},{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":57,"b":70}]}],"statement":"INSERT INTO nonces(nonce, block_height)\nVALUES (:nonce!, :block_height!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO nonces(nonce, block_height)
 * VALUES (:nonce!, :block_height!)
 * ```
 */
export const insertNonce = new PreparedQuery<IInsertNonceParams,IInsertNonceResult>(insertNonceIR);


