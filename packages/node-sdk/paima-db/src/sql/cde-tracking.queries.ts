/** Types generated for queries found in "src/sql/cde-tracking.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'MarkCdeBlockheightProcessed' parameters type */
export interface IMarkCdeBlockheightProcessedParams {
  block_height: number;
  caip2: string;
}

/** 'MarkCdeBlockheightProcessed' return type */
export type IMarkCdeBlockheightProcessedResult = void;

/** 'MarkCdeBlockheightProcessed' query type */
export interface IMarkCdeBlockheightProcessedQuery {
  params: IMarkCdeBlockheightProcessedParams;
  result: IMarkCdeBlockheightProcessedResult;
}

const markCdeBlockheightProcessedIR: any = {"usedParamSet":{"block_height":true,"caip2":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":54,"b":67}]},{"name":"caip2","required":true,"transform":{"type":"scalar"},"locs":[{"a":70,"b":76}]}],"statement":"INSERT INTO cde_tracking(block_height, caip2)\nVALUES (:block_height!, :caip2!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_tracking(block_height, caip2)
 * VALUES (:block_height!, :caip2!)
 * ```
 */
export const markCdeBlockheightProcessed = new PreparedQuery<IMarkCdeBlockheightProcessedParams,IMarkCdeBlockheightProcessedResult>(markCdeBlockheightProcessedIR);


/** 'GetLatestProcessedCdeBlockheight' parameters type */
export interface IGetLatestProcessedCdeBlockheightParams {
  caip2: string;
}

/** 'GetLatestProcessedCdeBlockheight' return type */
export interface IGetLatestProcessedCdeBlockheightResult {
  block_height: number;
}

/** 'GetLatestProcessedCdeBlockheight' query type */
export interface IGetLatestProcessedCdeBlockheightQuery {
  params: IGetLatestProcessedCdeBlockheightParams;
  result: IGetLatestProcessedCdeBlockheightResult;
}

const getLatestProcessedCdeBlockheightIR: any = {"usedParamSet":{"caip2":true},"params":[{"name":"caip2","required":true,"transform":{"type":"scalar"},"locs":[{"a":52,"b":58}]}],"statement":"SELECT block_height FROM cde_tracking\nWHERE caip2 = :caip2!\nORDER BY block_height DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT block_height FROM cde_tracking
 * WHERE caip2 = :caip2!
 * ORDER BY block_height DESC
 * LIMIT 1
 * ```
 */
export const getLatestProcessedCdeBlockheight = new PreparedQuery<IGetLatestProcessedCdeBlockheightParams,IGetLatestProcessedCdeBlockheightResult>(getLatestProcessedCdeBlockheightIR);


