/** Types generated for queries found in "src/sql/mina-checkpoints.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'UpdateMinaCheckpoint' parameters type */
export interface IUpdateMinaCheckpointParams {
  caip2: string;
  timestamp: string;
}

/** 'UpdateMinaCheckpoint' return type */
export type IUpdateMinaCheckpointResult = void;

/** 'UpdateMinaCheckpoint' query type */
export interface IUpdateMinaCheckpointQuery {
  params: IUpdateMinaCheckpointParams;
  result: IUpdateMinaCheckpointResult;
}

const updateMinaCheckpointIR: any = {"usedParamSet":{"timestamp":true,"caip2":true},"params":[{"name":"timestamp","required":true,"transform":{"type":"scalar"},"locs":[{"a":69,"b":79},{"a":143,"b":153}]},{"name":"caip2","required":true,"transform":{"type":"scalar"},"locs":[{"a":86,"b":92}]}],"statement":"INSERT INTO mina_checkpoint(\n    timestamp,\n    caip2\n) VALUES (\n    :timestamp!,\n    :caip2!\n) \nON CONFLICT (caip2) DO\nUPDATE SET timestamp = :timestamp!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO mina_checkpoint(
 *     timestamp,
 *     caip2
 * ) VALUES (
 *     :timestamp!,
 *     :caip2!
 * ) 
 * ON CONFLICT (caip2) DO
 * UPDATE SET timestamp = :timestamp!
 * ```
 */
export const updateMinaCheckpoint = new PreparedQuery<IUpdateMinaCheckpointParams,IUpdateMinaCheckpointResult>(updateMinaCheckpointIR);


/** 'GetMinaCheckpoint' parameters type */
export interface IGetMinaCheckpointParams {
  caip2: string;
}

/** 'GetMinaCheckpoint' return type */
export interface IGetMinaCheckpointResult {
  timestamp: string;
}

/** 'GetMinaCheckpoint' query type */
export interface IGetMinaCheckpointQuery {
  params: IGetMinaCheckpointParams;
  result: IGetMinaCheckpointResult;
}

const getMinaCheckpointIR: any = {"usedParamSet":{"caip2":true},"params":[{"name":"caip2","required":true,"transform":{"type":"scalar"},"locs":[{"a":52,"b":58}]}],"statement":"SELECT timestamp FROM mina_checkpoint WHERE caip2 = :caip2! LIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT timestamp FROM mina_checkpoint WHERE caip2 = :caip2! LIMIT 1
 * ```
 */
export const getMinaCheckpoint = new PreparedQuery<IGetMinaCheckpointParams,IGetMinaCheckpointResult>(getMinaCheckpointIR);


