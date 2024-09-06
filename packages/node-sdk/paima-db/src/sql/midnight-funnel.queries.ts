/** Types generated for queries found in "src/sql/midnight-funnel.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'UpdateMidnightCheckpoint' parameters type */
export interface IUpdateMidnightCheckpointParams {
  caip2: string;
  timestamp: string;
}

/** 'UpdateMidnightCheckpoint' return type */
export type IUpdateMidnightCheckpointResult = void;

/** 'UpdateMidnightCheckpoint' query type */
export interface IUpdateMidnightCheckpointQuery {
  params: IUpdateMidnightCheckpointParams;
  result: IUpdateMidnightCheckpointResult;
}

const updateMidnightCheckpointIR: any = {"usedParamSet":{"caip2":true,"timestamp":true},"params":[{"name":"caip2","required":true,"transform":{"type":"scalar"},"locs":[{"a":73,"b":79}]},{"name":"timestamp","required":true,"transform":{"type":"scalar"},"locs":[{"a":86,"b":96},{"a":146,"b":156}]}],"statement":"INSERT INTO midnight_checkpoint(\n    caip2,\n    timestamp\n) VALUES (\n    :caip2!,\n    :timestamp!\n)\nON CONFLICT (caip2) DO\nUPDATE SET timestamp = :timestamp!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO midnight_checkpoint(
 *     caip2,
 *     timestamp
 * ) VALUES (
 *     :caip2!,
 *     :timestamp!
 * )
 * ON CONFLICT (caip2) DO
 * UPDATE SET timestamp = :timestamp!
 * ```
 */
export const updateMidnightCheckpoint = new PreparedQuery<IUpdateMidnightCheckpointParams,IUpdateMidnightCheckpointResult>(updateMidnightCheckpointIR);


/** 'GetMidnightCheckpoint' parameters type */
export interface IGetMidnightCheckpointParams {
  caip2: string;
}

/** 'GetMidnightCheckpoint' return type */
export interface IGetMidnightCheckpointResult {
  timestamp: string;
}

/** 'GetMidnightCheckpoint' query type */
export interface IGetMidnightCheckpointQuery {
  params: IGetMidnightCheckpointParams;
  result: IGetMidnightCheckpointResult;
}

const getMidnightCheckpointIR: any = {"usedParamSet":{"caip2":true},"params":[{"name":"caip2","required":true,"transform":{"type":"scalar"},"locs":[{"a":56,"b":62}]}],"statement":"SELECT timestamp FROM midnight_checkpoint WHERE caip2 = :caip2! LIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT timestamp FROM midnight_checkpoint WHERE caip2 = :caip2! LIMIT 1
 * ```
 */
export const getMidnightCheckpoint = new PreparedQuery<IGetMidnightCheckpointParams,IGetMidnightCheckpointResult>(getMidnightCheckpointIR);


