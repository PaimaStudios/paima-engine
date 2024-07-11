/** Types generated for queries found in "src/sql/scheduled.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'NewScheduledData' parameters type */
export interface INewScheduledDataParams {
  block_height: number;
  cde_name?: string | null | void;
  input_data: string;
  precompile?: string | null | void;
  tx_hash?: string | null | void;
}

/** 'NewScheduledData' return type */
export type INewScheduledDataResult = void;

/** 'NewScheduledData' query type */
export interface INewScheduledDataQuery {
  params: INewScheduledDataParams;
  result: INewScheduledDataResult;
}

const newScheduledDataIR: any = {"usedParamSet":{"block_height":true,"input_data":true,"tx_hash":true,"cde_name":true,"precompile":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":83,"b":96}]},{"name":"input_data","required":true,"transform":{"type":"scalar"},"locs":[{"a":99,"b":110}]},{"name":"tx_hash","required":false,"transform":{"type":"scalar"},"locs":[{"a":231,"b":238},{"a":253,"b":260}]},{"name":"cde_name","required":false,"transform":{"type":"scalar"},"locs":[{"a":387,"b":395},{"a":411,"b":419}]},{"name":"precompile","required":false,"transform":{"type":"scalar"},"locs":[{"a":522,"b":532},{"a":546,"b":556}]}],"statement":"WITH new_row AS (\n  INSERT INTO scheduled_data(block_height, input_data)\n  VALUES (:block_height!, :input_data!)\n  RETURNING id\n),\ninsert_hash AS (\n\tINSERT INTO scheduled_data_tx_hash(id, tx_hash)\n\tSELECT (SELECT id FROM new_row), :tx_hash::TEXT\n\tWHERE :tx_hash IS NOT NULL\n),\ninsert_extension AS (\n  INSERT INTO scheduled_data_extension(id, cde_name)\n  SELECT (SELECT id FROM new_row), :cde_name::TEXT\n  WHERE :cde_name IS NOT NULL\n)\nINSERT INTO scheduled_data_precompile(id, precompile)\nSELECT (SELECT id FROM new_row), :precompile::TEXT\nWHERE :precompile IS NOT NULL"};

/**
 * Query generated from SQL:
 * ```
 * WITH new_row AS (
 *   INSERT INTO scheduled_data(block_height, input_data)
 *   VALUES (:block_height!, :input_data!)
 *   RETURNING id
 * ),
 * insert_hash AS (
 * 	INSERT INTO scheduled_data_tx_hash(id, tx_hash)
 * 	SELECT (SELECT id FROM new_row), :tx_hash::TEXT
 * 	WHERE :tx_hash IS NOT NULL
 * ),
 * insert_extension AS (
 *   INSERT INTO scheduled_data_extension(id, cde_name)
 *   SELECT (SELECT id FROM new_row), :cde_name::TEXT
 *   WHERE :cde_name IS NOT NULL
 * )
 * INSERT INTO scheduled_data_precompile(id, precompile)
 * SELECT (SELECT id FROM new_row), :precompile::TEXT
 * WHERE :precompile IS NOT NULL
 * ```
 */
export const newScheduledData = new PreparedQuery<INewScheduledDataParams,INewScheduledDataResult>(newScheduledDataIR);


/** 'GetScheduledDataByBlockHeight' parameters type */
export interface IGetScheduledDataByBlockHeightParams {
  block_height: number;
}

/** 'GetScheduledDataByBlockHeight' return type */
export interface IGetScheduledDataByBlockHeightResult {
  block_height: number;
  cde_name: string | null;
  id: number;
  input_data: string;
  precompile: string | null;
  tx_hash: string | null;
}

/** 'GetScheduledDataByBlockHeight' query type */
export interface IGetScheduledDataByBlockHeightQuery {
  params: IGetScheduledDataByBlockHeightParams;
  result: IGetScheduledDataByBlockHeightResult;
}

const getScheduledDataByBlockHeightIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":435,"b":448}]}],"statement":"SELECT scheduled_data.id,\n  block_height,\n  input_data,\n  tx_hash as \"tx_hash?\",\n  cde_name as \"cde_name?\",\n  precompile as \"precompile?\"\nFROM scheduled_data\nLEFT JOIN scheduled_data_tx_hash\nON scheduled_data.id = scheduled_data_tx_hash.id\nLEFT JOIN scheduled_data_extension\nON scheduled_data.id = scheduled_data_extension.id\nLEFT JOIN scheduled_data_precompile\nON scheduled_data.id = scheduled_data_precompile.id\nWHERE block_height = :block_height!\nORDER BY scheduled_data.id ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT scheduled_data.id,
 *   block_height,
 *   input_data,
 *   tx_hash as "tx_hash?",
 *   cde_name as "cde_name?",
 *   precompile as "precompile?"
 * FROM scheduled_data
 * LEFT JOIN scheduled_data_tx_hash
 * ON scheduled_data.id = scheduled_data_tx_hash.id
 * LEFT JOIN scheduled_data_extension
 * ON scheduled_data.id = scheduled_data_extension.id
 * LEFT JOIN scheduled_data_precompile
 * ON scheduled_data.id = scheduled_data_precompile.id
 * WHERE block_height = :block_height!
 * ORDER BY scheduled_data.id ASC
 * ```
 */
export const getScheduledDataByBlockHeight = new PreparedQuery<IGetScheduledDataByBlockHeightParams,IGetScheduledDataByBlockHeightResult>(getScheduledDataByBlockHeightIR);


/** 'RemoveScheduledData' parameters type */
export interface IRemoveScheduledDataParams {
  block_height: number;
  input_data: string;
}

/** 'RemoveScheduledData' return type */
export type IRemoveScheduledDataResult = void;

/** 'RemoveScheduledData' query type */
export interface IRemoveScheduledDataQuery {
  params: IRemoveScheduledDataParams;
  result: IRemoveScheduledDataResult;
}

const removeScheduledDataIR: any = {"usedParamSet":{"block_height":true,"input_data":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":48,"b":61}]},{"name":"input_data","required":true,"transform":{"type":"scalar"},"locs":[{"a":80,"b":91}]}],"statement":"DELETE FROM scheduled_data\nWHERE block_height = :block_height!\nAND input_data = :input_data!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM scheduled_data
 * WHERE block_height = :block_height!
 * AND input_data = :input_data!
 * ```
 */
export const removeScheduledData = new PreparedQuery<IRemoveScheduledDataParams,IRemoveScheduledDataResult>(removeScheduledDataIR);


/** 'RemoveAllScheduledDataByInputData' parameters type */
export interface IRemoveAllScheduledDataByInputDataParams {
  input_data: string;
}

/** 'RemoveAllScheduledDataByInputData' return type */
export type IRemoveAllScheduledDataByInputDataResult = void;

/** 'RemoveAllScheduledDataByInputData' query type */
export interface IRemoveAllScheduledDataByInputDataQuery {
  params: IRemoveAllScheduledDataByInputDataParams;
  result: IRemoveAllScheduledDataByInputDataResult;
}

const removeAllScheduledDataByInputDataIR: any = {"usedParamSet":{"input_data":true},"params":[{"name":"input_data","required":true,"transform":{"type":"scalar"},"locs":[{"a":46,"b":57}]}],"statement":"DELETE FROM scheduled_data\nWHERE input_data = :input_data!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM scheduled_data
 * WHERE input_data = :input_data!
 * ```
 */
export const removeAllScheduledDataByInputData = new PreparedQuery<IRemoveAllScheduledDataByInputDataParams,IRemoveAllScheduledDataByInputDataResult>(removeAllScheduledDataByInputDataIR);


/** 'DeleteScheduled' parameters type */
export interface IDeleteScheduledParams {
  id: number;
}

/** 'DeleteScheduled' return type */
export type IDeleteScheduledResult = void;

/** 'DeleteScheduled' query type */
export interface IDeleteScheduledQuery {
  params: IDeleteScheduledParams;
  result: IDeleteScheduledResult;
}

const deleteScheduledIR: any = {"usedParamSet":{"id":true},"params":[{"name":"id","required":true,"transform":{"type":"scalar"},"locs":[{"a":38,"b":41}]}],"statement":"DELETE FROM scheduled_data\nWHERE id = :id!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM scheduled_data
 * WHERE id = :id!
 * ```
 */
export const deleteScheduled = new PreparedQuery<IDeleteScheduledParams,IDeleteScheduledResult>(deleteScheduledIR);


