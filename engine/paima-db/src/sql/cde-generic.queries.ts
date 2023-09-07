/** Types generated for queries found in "src/sql/cde-generic.sql" */
import { PreparedQuery } from '@pgtyped/query';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'CdeGenericGetAllData' parameters type */
export interface ICdeGenericGetAllDataParams {
  cde_id: number;
}

/** 'CdeGenericGetAllData' return type */
export interface ICdeGenericGetAllDataResult {
  block_height: number;
  cde_id: number;
  event_data: Json;
  id: number;
}

/** 'CdeGenericGetAllData' query type */
export interface ICdeGenericGetAllDataQuery {
  params: ICdeGenericGetAllDataParams;
  result: ICdeGenericGetAllDataResult;
}

const cdeGenericGetAllDataIR: any = {"usedParamSet":{"cde_id":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":46,"b":53}]}],"statement":"SELECT * FROM cde_generic_data\nWHERE cde_id = :cde_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_generic_data
 * WHERE cde_id = :cde_id!
 * ```
 */
export const cdeGenericGetAllData = new PreparedQuery<ICdeGenericGetAllDataParams,ICdeGenericGetAllDataResult>(cdeGenericGetAllDataIR);


/** 'CdeGenericGetBlockheightData' parameters type */
export interface ICdeGenericGetBlockheightDataParams {
  block_height: number;
  cde_id: number;
}

/** 'CdeGenericGetBlockheightData' return type */
export interface ICdeGenericGetBlockheightDataResult {
  block_height: number;
  cde_id: number;
  event_data: Json;
  id: number;
}

/** 'CdeGenericGetBlockheightData' query type */
export interface ICdeGenericGetBlockheightDataQuery {
  params: ICdeGenericGetBlockheightDataParams;
  result: ICdeGenericGetBlockheightDataResult;
}

const cdeGenericGetBlockheightDataIR: any = {"usedParamSet":{"cde_id":true,"block_height":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":46,"b":53}]},{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":74,"b":87}]}],"statement":"SELECT * FROM cde_generic_data\nWHERE cde_id = :cde_id!\nAND block_height = :block_height!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_generic_data
 * WHERE cde_id = :cde_id!
 * AND block_height = :block_height!
 * ```
 */
export const cdeGenericGetBlockheightData = new PreparedQuery<ICdeGenericGetBlockheightDataParams,ICdeGenericGetBlockheightDataResult>(cdeGenericGetBlockheightDataIR);


/** 'CdeGenericGetRangeData' parameters type */
export interface ICdeGenericGetRangeDataParams {
  cde_id: number;
  from_block: number;
  to_block: number;
}

/** 'CdeGenericGetRangeData' return type */
export interface ICdeGenericGetRangeDataResult {
  block_height: number;
  cde_id: number;
  event_data: Json;
  id: number;
}

/** 'CdeGenericGetRangeData' query type */
export interface ICdeGenericGetRangeDataQuery {
  params: ICdeGenericGetRangeDataParams;
  result: ICdeGenericGetRangeDataResult;
}

const cdeGenericGetRangeDataIR: any = {"usedParamSet":{"cde_id":true,"from_block":true,"to_block":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":46,"b":53}]},{"name":"from_block","required":true,"transform":{"type":"scalar"},"locs":[{"a":75,"b":86}]},{"name":"to_block","required":true,"transform":{"type":"scalar"},"locs":[{"a":108,"b":117}]}],"statement":"SELECT * FROM cde_generic_data\nWHERE cde_id = :cde_id!\nAND block_height >= :from_block!\nAND block_height <= :to_block!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_generic_data
 * WHERE cde_id = :cde_id!
 * AND block_height >= :from_block!
 * AND block_height <= :to_block!
 * ```
 */
export const cdeGenericGetRangeData = new PreparedQuery<ICdeGenericGetRangeDataParams,ICdeGenericGetRangeDataResult>(cdeGenericGetRangeDataIR);


/** 'CdeGenericInsertData' parameters type */
export interface ICdeGenericInsertDataParams {
  block_height: number;
  cde_id: number;
  event_data: Json;
}

/** 'CdeGenericInsertData' return type */
export type ICdeGenericInsertDataResult = void;

/** 'CdeGenericInsertData' query type */
export interface ICdeGenericInsertDataQuery {
  params: ICdeGenericInsertDataParams;
  result: ICdeGenericInsertDataResult;
}

const cdeGenericInsertDataIR: any = {"usedParamSet":{"cde_id":true,"block_height":true,"event_data":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":90,"b":97}]},{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":104,"b":117}]},{"name":"event_data","required":true,"transform":{"type":"scalar"},"locs":[{"a":124,"b":135}]}],"statement":"INSERT INTO cde_generic_data(\n    cde_id,\n    block_height,\n    event_data\n) VALUES (\n    :cde_id!,\n    :block_height!,\n    :event_data!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_generic_data(
 *     cde_id,
 *     block_height,
 *     event_data
 * ) VALUES (
 *     :cde_id!,
 *     :block_height!,
 *     :event_data!
 * )
 * ```
 */
export const cdeGenericInsertData = new PreparedQuery<ICdeGenericInsertDataParams,ICdeGenericInsertDataResult>(cdeGenericInsertDataIR);


