/** Types generated for queries found in "src/sql/presync.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'MarkPresyncBlockheightTouched' parameters type */
export interface IMarkPresyncBlockheightTouchedParams {
  block_height: number;
}

/** 'MarkPresyncBlockheightTouched' return type */
export type IMarkPresyncBlockheightTouchedResult = void;

/** 'MarkPresyncBlockheightTouched' query type */
export interface IMarkPresyncBlockheightTouchedQuery {
  params: IMarkPresyncBlockheightTouchedParams;
  result: IMarkPresyncBlockheightTouchedResult;
}

const markPresyncBlockheightTouchedIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":62,"b":75}]}],"statement":"INSERT INTO presync_block_heights(block_height, done)\nVALUES (:block_height!, FALSE)\nON CONFLICT (block_height)\nDO UPDATE SET\nblock_height = EXCLUDED.block_height,\ndone = EXCLUDED.done"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO presync_block_heights(block_height, done)
 * VALUES (:block_height!, FALSE)
 * ON CONFLICT (block_height)
 * DO UPDATE SET
 * block_height = EXCLUDED.block_height,
 * done = EXCLUDED.done
 * ```
 */
export const markPresyncBlockheightTouched = new PreparedQuery<IMarkPresyncBlockheightTouchedParams,IMarkPresyncBlockheightTouchedResult>(markPresyncBlockheightTouchedIR);


/** 'MarkPresyncBlockheightProcessed' parameters type */
export interface IMarkPresyncBlockheightProcessedParams {
  block_height: number;
}

/** 'MarkPresyncBlockheightProcessed' return type */
export type IMarkPresyncBlockheightProcessedResult = void;

/** 'MarkPresyncBlockheightProcessed' query type */
export interface IMarkPresyncBlockheightProcessedQuery {
  params: IMarkPresyncBlockheightProcessedParams;
  result: IMarkPresyncBlockheightProcessedResult;
}

const markPresyncBlockheightProcessedIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":62,"b":75}]}],"statement":"INSERT INTO presync_block_heights(block_height, done)\nVALUES (:block_height!, TRUE)\nON CONFLICT (block_height)\nDO UPDATE SET\nblock_height = EXCLUDED.block_height,\ndone = EXCLUDED.done"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO presync_block_heights(block_height, done)
 * VALUES (:block_height!, TRUE)
 * ON CONFLICT (block_height)
 * DO UPDATE SET
 * block_height = EXCLUDED.block_height,
 * done = EXCLUDED.done
 * ```
 */
export const markPresyncBlockheightProcessed = new PreparedQuery<IMarkPresyncBlockheightProcessedParams,IMarkPresyncBlockheightProcessedResult>(markPresyncBlockheightProcessedIR);


/** 'GetLatestProcessedPresyncBlockheight' parameters type */
export type IGetLatestProcessedPresyncBlockheightParams = void;

/** 'GetLatestProcessedPresyncBlockheight' return type */
export interface IGetLatestProcessedPresyncBlockheightResult {
  block_height: number;
  done: boolean;
}

/** 'GetLatestProcessedPresyncBlockheight' query type */
export interface IGetLatestProcessedPresyncBlockheightQuery {
  params: IGetLatestProcessedPresyncBlockheightParams;
  result: IGetLatestProcessedPresyncBlockheightResult;
}

const getLatestProcessedPresyncBlockheightIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM presync_block_heights\nWHERE done IS TRUE\nORDER BY block_height DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM presync_block_heights
 * WHERE done IS TRUE
 * ORDER BY block_height DESC
 * LIMIT 1
 * ```
 */
export const getLatestProcessedPresyncBlockheight = new PreparedQuery<IGetLatestProcessedPresyncBlockheightParams,IGetLatestProcessedPresyncBlockheightResult>(getLatestProcessedPresyncBlockheightIR);


