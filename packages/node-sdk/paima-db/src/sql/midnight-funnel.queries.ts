/** Types generated for queries found in "src/sql/midnight-funnel.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'UpdateMidnightCheckpoint' parameters type */
export interface IUpdateMidnightCheckpointParams {
  block_height: number;
  caip2: string;
}

/** 'UpdateMidnightCheckpoint' return type */
export type IUpdateMidnightCheckpointResult = void;

/** 'UpdateMidnightCheckpoint' query type */
export interface IUpdateMidnightCheckpointQuery {
  params: IUpdateMidnightCheckpointParams;
  result: IUpdateMidnightCheckpointResult;
}

const updateMidnightCheckpointIR: any = {"usedParamSet":{"caip2":true,"block_height":true},"params":[{"name":"caip2","required":true,"transform":{"type":"scalar"},"locs":[{"a":76,"b":82}]},{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":89,"b":102},{"a":155,"b":168}]}],"statement":"INSERT INTO midnight_checkpoint(\n    caip2,\n    block_height\n) VALUES (\n    :caip2!,\n    :block_height!\n)\nON CONFLICT (caip2) DO\nUPDATE SET block_height = :block_height!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO midnight_checkpoint(
 *     caip2,
 *     block_height
 * ) VALUES (
 *     :caip2!,
 *     :block_height!
 * )
 * ON CONFLICT (caip2) DO
 * UPDATE SET block_height = :block_height!
 * ```
 */
export const updateMidnightCheckpoint = new PreparedQuery<IUpdateMidnightCheckpointParams,IUpdateMidnightCheckpointResult>(updateMidnightCheckpointIR);


/** 'GetMidnightCheckpoint' parameters type */
export interface IGetMidnightCheckpointParams {
  caip2: string;
}

/** 'GetMidnightCheckpoint' return type */
export interface IGetMidnightCheckpointResult {
  block_height: number;
}

/** 'GetMidnightCheckpoint' query type */
export interface IGetMidnightCheckpointQuery {
  params: IGetMidnightCheckpointParams;
  result: IGetMidnightCheckpointResult;
}

const getMidnightCheckpointIR: any = {"usedParamSet":{"caip2":true},"params":[{"name":"caip2","required":true,"transform":{"type":"scalar"},"locs":[{"a":59,"b":65}]}],"statement":"SELECT block_height FROM midnight_checkpoint WHERE caip2 = :caip2! LIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT block_height FROM midnight_checkpoint WHERE caip2 = :caip2! LIMIT 1
 * ```
 */
export const getMidnightCheckpoint = new PreparedQuery<IGetMidnightCheckpointParams,IGetMidnightCheckpointResult>(getMidnightCheckpointIR);


