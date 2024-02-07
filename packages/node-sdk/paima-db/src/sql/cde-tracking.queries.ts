/** Types generated for queries found in "src/sql/cde-tracking.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'MarkCdeBlockheightProcessed' parameters type */
export interface IMarkCdeBlockheightProcessedParams {
  block_height: number;
  network: string;
}

/** 'MarkCdeBlockheightProcessed' return type */
export type IMarkCdeBlockheightProcessedResult = void;

/** 'MarkCdeBlockheightProcessed' query type */
export interface IMarkCdeBlockheightProcessedQuery {
  params: IMarkCdeBlockheightProcessedParams;
  result: IMarkCdeBlockheightProcessedResult;
}

const markCdeBlockheightProcessedIR: any = {"usedParamSet":{"block_height":true,"network":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":56,"b":69}]},{"name":"network","required":true,"transform":{"type":"scalar"},"locs":[{"a":72,"b":80}]}],"statement":"INSERT INTO cde_tracking(block_height, network)\nVALUES (:block_height!, :network!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_tracking(block_height, network)
 * VALUES (:block_height!, :network!)
 * ```
 */
export const markCdeBlockheightProcessed = new PreparedQuery<IMarkCdeBlockheightProcessedParams,IMarkCdeBlockheightProcessedResult>(markCdeBlockheightProcessedIR);


/** 'GetLatestProcessedCdeBlockheight' parameters type */
export interface IGetLatestProcessedCdeBlockheightParams {
  network: string;
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

const getLatestProcessedCdeBlockheightIR: any = {"usedParamSet":{"network":true},"params":[{"name":"network","required":true,"transform":{"type":"scalar"},"locs":[{"a":54,"b":62}]}],"statement":"SELECT block_height FROM cde_tracking\nWHERE network = :network!\nORDER BY block_height DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT block_height FROM cde_tracking
 * WHERE network = :network!
 * ORDER BY block_height DESC
 * LIMIT 1
 * ```
 */
export const getLatestProcessedCdeBlockheight = new PreparedQuery<IGetLatestProcessedCdeBlockheightParams,IGetLatestProcessedCdeBlockheightResult>(getLatestProcessedCdeBlockheightIR);


