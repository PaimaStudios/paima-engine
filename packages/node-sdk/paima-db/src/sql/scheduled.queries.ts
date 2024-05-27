/** Types generated for queries found in "src/sql/scheduled.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'NewScheduledData' parameters type */
export interface INewScheduledDataParams {
  block_height: number;
  cde_name?: string | null | void;
  input_data: string;
  tx_hash?: string | null | void;
}

/** 'NewScheduledData' return type */
export type INewScheduledDataResult = void;

/** 'NewScheduledData' query type */
export interface INewScheduledDataQuery {
  params: INewScheduledDataParams;
  result: INewScheduledDataResult;
}

const newScheduledDataIR: any = {"usedParamSet":{"block_height":true,"input_data":true,"tx_hash":true,"cde_name":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":83,"b":96}]},{"name":"input_data","required":true,"transform":{"type":"scalar"},"locs":[{"a":99,"b":110}]},{"name":"tx_hash","required":false,"transform":{"type":"scalar"},"locs":[{"a":231,"b":238},{"a":253,"b":260}]},{"name":"cde_name","required":false,"transform":{"type":"scalar"},"locs":[{"a":360,"b":368},{"a":382,"b":390}]}],"statement":"WITH new_row AS (\n  INSERT INTO scheduled_data(block_height, input_data)\n  VALUES (:block_height!, :input_data!)\n  RETURNING id\n),\ninsert_hash AS (\n\tINSERT INTO scheduled_data_tx_hash(id, tx_hash)\n\tSELECT (SELECT id FROM new_row), :tx_hash::TEXT\n\tWHERE :tx_hash IS NOT NULL\n)\nINSERT INTO scheduled_data_extension(id, cde_name)\nSELECT (SELECT id FROM new_row), :cde_name::TEXT\nWHERE :cde_name IS NOT NULL"};

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
 * )
 * INSERT INTO scheduled_data_extension(id, cde_name)
 * SELECT (SELECT id FROM new_row), :cde_name::TEXT
 * WHERE :cde_name IS NOT NULL
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
  cde_name: string;
  id: number;
  input_data: string;
  tx_hash: string;
}

/** 'GetScheduledDataByBlockHeight' query type */
export interface IGetScheduledDataByBlockHeightQuery {
  params: IGetScheduledDataByBlockHeightParams;
  result: IGetScheduledDataByBlockHeightResult;
}

const getScheduledDataByBlockHeightIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":279,"b":292}]}],"statement":"SELECT scheduled_data.id, block_height, input_data, tx_hash, cde_name\nFROM scheduled_data\nLEFT JOIN scheduled_data_tx_hash\nON scheduled_data.id = scheduled_data_tx_hash.id\nLEFT JOIN scheduled_data_extension\nON scheduled_data.id = scheduled_data_extension.id\nWHERE block_height = :block_height!\nORDER BY scheduled_data.id ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT scheduled_data.id, block_height, input_data, tx_hash, cde_name
 * FROM scheduled_data
 * LEFT JOIN scheduled_data_tx_hash
 * ON scheduled_data.id = scheduled_data_tx_hash.id
 * LEFT JOIN scheduled_data_extension
 * ON scheduled_data.id = scheduled_data_extension.id
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


