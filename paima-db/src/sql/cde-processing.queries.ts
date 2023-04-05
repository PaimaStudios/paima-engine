/** Types generated for queries found in "src/sql/cde-processing.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'MarkCdeBlockheightTouched' parameters type */
export interface IMarkCdeBlockheightTouchedParams {
  block_height: number;
}

/** 'MarkCdeBlockheightTouched' return type */
export type IMarkCdeBlockheightTouchedResult = void;

/** 'MarkCdeBlockheightTouched' query type */
export interface IMarkCdeBlockheightTouchedQuery {
  params: IMarkCdeBlockheightTouchedParams;
  result: IMarkCdeBlockheightTouchedResult;
}

const markCdeBlockheightTouchedIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":55,"b":68}]}],"statement":"INSERT INTO cde_processing(block_height, done)\nVALUES (:block_height!, FALSE)\nON CONFLICT (block_height)\nDO UPDATE SET\nblock_height = EXCLUDED.block_height,\ndone = EXCLUDED.done"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_processing(block_height, done)
 * VALUES (:block_height!, FALSE)
 * ON CONFLICT (block_height)
 * DO UPDATE SET
 * block_height = EXCLUDED.block_height,
 * done = EXCLUDED.done
 * ```
 */
export const markCdeBlockheightTouched = new PreparedQuery<IMarkCdeBlockheightTouchedParams,IMarkCdeBlockheightTouchedResult>(markCdeBlockheightTouchedIR);


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

const markCdeBlockheightProcessedIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":55,"b":68}]}],"statement":"INSERT INTO cde_processing(block_height, done)\nVALUES (:block_height!, TRUE)\nON CONFLICT (block_height)\nDO UPDATE SET\nblock_height = EXCLUDED.block_height,\ndone = EXCLUDED.done"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_processing(block_height, done)
 * VALUES (:block_height!, TRUE)
 * ON CONFLICT (block_height)
 * DO UPDATE SET
 * block_height = EXCLUDED.block_height,
 * done = EXCLUDED.done
 * ```
 */
export const markCdeBlockheightProcessed = new PreparedQuery<IMarkCdeBlockheightProcessedParams,IMarkCdeBlockheightProcessedResult>(markCdeBlockheightProcessedIR);


/** 'GetLatestProcessedCdeBlockheight' parameters type */
export type IGetLatestProcessedCdeBlockheightParams = void;

/** 'GetLatestProcessedCdeBlockheight' return type */
export interface IGetLatestProcessedCdeBlockheightResult {
  block_height: number;
  done: boolean;
}

/** 'GetLatestProcessedCdeBlockheight' query type */
export interface IGetLatestProcessedCdeBlockheightQuery {
  params: IGetLatestProcessedCdeBlockheightParams;
  result: IGetLatestProcessedCdeBlockheightResult;
}

const getLatestProcessedCdeBlockheightIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM cde_processing\nWHERE done IS TRUE\nORDER BY block_height DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_processing
 * WHERE done IS TRUE
 * ORDER BY block_height DESC
 * LIMIT 1
 * ```
 */
export const getLatestProcessedCdeBlockheight = new PreparedQuery<IGetLatestProcessedCdeBlockheightParams,IGetLatestProcessedCdeBlockheightResult>(getLatestProcessedCdeBlockheightIR);


