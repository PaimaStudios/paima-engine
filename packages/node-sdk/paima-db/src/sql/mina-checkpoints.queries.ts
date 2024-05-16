/** Types generated for queries found in "src/sql/mina-checkpoints.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'UpdateMinaCheckpoint' parameters type */
export interface IUpdateMinaCheckpointParams {
  network: string;
  timestamp: string;
}

/** 'UpdateMinaCheckpoint' return type */
export type IUpdateMinaCheckpointResult = void;

/** 'UpdateMinaCheckpoint' query type */
export interface IUpdateMinaCheckpointQuery {
  params: IUpdateMinaCheckpointParams;
  result: IUpdateMinaCheckpointResult;
}

const updateMinaCheckpointIR: any = {"usedParamSet":{"timestamp":true,"network":true},"params":[{"name":"timestamp","required":true,"transform":{"type":"scalar"},"locs":[{"a":71,"b":81},{"a":149,"b":159}]},{"name":"network","required":true,"transform":{"type":"scalar"},"locs":[{"a":88,"b":96}]}],"statement":"INSERT INTO mina_checkpoint(\n    timestamp,\n    network\n) VALUES (\n    :timestamp!,\n    :network!\n) \nON CONFLICT (network) DO\nUPDATE SET timestamp = :timestamp!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO mina_checkpoint(
 *     timestamp,
 *     network
 * ) VALUES (
 *     :timestamp!,
 *     :network!
 * ) 
 * ON CONFLICT (network) DO
 * UPDATE SET timestamp = :timestamp!
 * ```
 */
export const updateMinaCheckpoint = new PreparedQuery<IUpdateMinaCheckpointParams,IUpdateMinaCheckpointResult>(updateMinaCheckpointIR);


/** 'GetMinaCheckpoint' parameters type */
export interface IGetMinaCheckpointParams {
  network: string;
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

const getMinaCheckpointIR: any = {"usedParamSet":{"network":true},"params":[{"name":"network","required":true,"transform":{"type":"scalar"},"locs":[{"a":54,"b":62}]}],"statement":"SELECT timestamp FROM mina_checkpoint WHERE network = :network! LIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT timestamp FROM mina_checkpoint WHERE network = :network! LIMIT 1
 * ```
 */
export const getMinaCheckpoint = new PreparedQuery<IGetMinaCheckpointParams,IGetMinaCheckpointResult>(getMinaCheckpointIR);


