/** Types generated for queries found in "src/sql/cde-tracking.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'MarkCdeDatumProcessed' parameters type */
export interface IMarkCdeDatumProcessedParams {
  block_height: number;
  datum_count?: number | null | void;
}

/** 'MarkCdeDatumProcessed' return type */
export type IMarkCdeDatumProcessedResult = void;

/** 'MarkCdeDatumProcessed' query type */
export interface IMarkCdeDatumProcessedQuery {
  params: IMarkCdeDatumProcessedParams;
  result: IMarkCdeDatumProcessedResult;
}

const markCdeDatumProcessedIR: any = {"usedParamSet":{"block_height":true,"datum_count":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":66,"b":79}]},{"name":"datum_count","required":false,"transform":{"type":"scalar"},"locs":[{"a":82,"b":93}]}],"statement":"INSERT INTO cde_tracking(block_height, datum_count, done)\nVALUES (:block_height!, :datum_count, FALSE)\nON CONFLICT (block_height)\nDO UPDATE SET\nblock_height = EXCLUDED.block_height,\ndatum_count = EXCLUDED.datum_count,\ndone = EXCLUDED.done"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_tracking(block_height, datum_count, done)
 * VALUES (:block_height!, :datum_count, FALSE)
 * ON CONFLICT (block_height)
 * DO UPDATE SET
 * block_height = EXCLUDED.block_height,
 * datum_count = EXCLUDED.datum_count,
 * done = EXCLUDED.done
 * ```
 */
export const markCdeDatumProcessed = new PreparedQuery<IMarkCdeDatumProcessedParams,IMarkCdeDatumProcessedResult>(markCdeDatumProcessedIR);


/** 'MarkCdeBlockheightProcessed' parameters type */
export interface IMarkCdeBlockheightProcessedParams {
  block_height: number;
}

/** 'MarkCdeBlockheightProcessed' return type */
export type IMarkCdeBlockheightProcessedResult = void;

/** 'MarkCdeBlockheightProcessed' query type */
export interface IMarkCdeBlockheightProcessedQuery {
  params: IMarkCdeBlockheightProcessedParams;
  result: IMarkCdeBlockheightProcessedResult;
}

const markCdeBlockheightProcessedIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":59,"b":72}]}],"statement":"UPDATE cde_tracking\nSET\n  done = TRUE\nWHERE block_height = :block_height!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE cde_tracking
 * SET
 *   done = TRUE
 * WHERE block_height = :block_height!
 * ```
 */
export const markCdeBlockheightProcessed = new PreparedQuery<IMarkCdeBlockheightProcessedParams,IMarkCdeBlockheightProcessedResult>(markCdeBlockheightProcessedIR);


/** 'GetSpecificCdeBlockheight' parameters type */
export interface IGetSpecificCdeBlockheightParams {
  block_height: number;
}

/** 'GetSpecificCdeBlockheight' return type */
export interface IGetSpecificCdeBlockheightResult {
  block_height: number;
  datum_count: number;
  done: boolean;
}

/** 'GetSpecificCdeBlockheight' query type */
export interface IGetSpecificCdeBlockheightQuery {
  params: IGetSpecificCdeBlockheightParams;
  result: IGetSpecificCdeBlockheightResult;
}

const getSpecificCdeBlockheightIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":48,"b":61}]}],"statement":"SELECT * FROM cde_tracking\nWHERE block_height = :block_height!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_tracking
 * WHERE block_height = :block_height!
 * ```
 */
export const getSpecificCdeBlockheight = new PreparedQuery<IGetSpecificCdeBlockheightParams,IGetSpecificCdeBlockheightResult>(getSpecificCdeBlockheightIR);


/** 'GetLatestProcessedCdeBlockheight' parameters type */
export type IGetLatestProcessedCdeBlockheightParams = void;

/** 'GetLatestProcessedCdeBlockheight' return type */
export interface IGetLatestProcessedCdeBlockheightResult {
  block_height: number;
  datum_count: number;
  done: boolean;
}

/** 'GetLatestProcessedCdeBlockheight' query type */
export interface IGetLatestProcessedCdeBlockheightQuery {
  params: IGetLatestProcessedCdeBlockheightParams;
  result: IGetLatestProcessedCdeBlockheightResult;
}

const getLatestProcessedCdeBlockheightIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM cde_tracking\nWHERE done IS TRUE\nORDER BY block_height DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_tracking
 * WHERE done IS TRUE
 * ORDER BY block_height DESC
 * LIMIT 1
 * ```
 */
export const getLatestProcessedCdeBlockheight = new PreparedQuery<IGetLatestProcessedCdeBlockheightParams,IGetLatestProcessedCdeBlockheightResult>(getLatestProcessedCdeBlockheightIR);


