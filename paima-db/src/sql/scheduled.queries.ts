/** Types generated for queries found in "src/sql/scheduled.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'NewScheduledData' parameters type */
export interface INewScheduledDataParams {
  block_height: number;
  input_data: string;
}

/** 'NewScheduledData' return type */
export type INewScheduledDataResult = void;

/** 'NewScheduledData' query type */
export interface INewScheduledDataQuery {
  params: INewScheduledDataParams;
  result: INewScheduledDataResult;
}

const newScheduledDataIR: any = {"usedParamSet":{"block_height":true,"input_data":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":61,"b":74}]},{"name":"input_data","required":true,"transform":{"type":"scalar"},"locs":[{"a":77,"b":88}]}],"statement":"INSERT INTO scheduled_data(block_height, input_data)\nVALUES (:block_height!, :input_data!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO scheduled_data(block_height, input_data)
 * VALUES (:block_height!, :input_data!)
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
  id: number;
  input_data: string;
}

/** 'GetScheduledDataByBlockHeight' query type */
export interface IGetScheduledDataByBlockHeightQuery {
  params: IGetScheduledDataByBlockHeightParams;
  result: IGetScheduledDataByBlockHeightResult;
}

const getScheduledDataByBlockHeightIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":50,"b":63}]}],"statement":"SELECT * from scheduled_data\nWHERE block_height = :block_height!\nORDER BY id ASC"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * from scheduled_data
 * WHERE block_height = :block_height!
 * ORDER BY id ASC
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


