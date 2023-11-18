/** Types generated for queries found in "src/sql/cde-tracking.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

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

const markCdeBlockheightProcessedIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":47,"b":60}]}],"statement":"INSERT INTO cde_tracking(block_height)\nVALUES (:block_height!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_tracking(block_height)
 * VALUES (:block_height!)
 * ```
 */
export const markCdeBlockheightProcessed = new PreparedQuery<IMarkCdeBlockheightProcessedParams,IMarkCdeBlockheightProcessedResult>(markCdeBlockheightProcessedIR);


/** 'GetLatestProcessedCdeBlockheight' parameters type */
export type IGetLatestProcessedCdeBlockheightParams = void;

/** 'GetLatestProcessedCdeBlockheight' return type */
export interface IGetLatestProcessedCdeBlockheightResult {
  block_height: number;
}

/** 'GetLatestProcessedCdeBlockheight' query type */
export interface IGetLatestProcessedCdeBlockheightQuery {
  params: IGetLatestProcessedCdeBlockheightParams;
  result: IGetLatestProcessedCdeBlockheightResult;
}

const getLatestProcessedCdeBlockheightIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM cde_tracking\nORDER BY block_height DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_tracking
 * ORDER BY block_height DESC
 * LIMIT 1
 * ```
 */
export const getLatestProcessedCdeBlockheight = new PreparedQuery<IGetLatestProcessedCdeBlockheightParams,IGetLatestProcessedCdeBlockheightResult>(getLatestProcessedCdeBlockheightIR);


