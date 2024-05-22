/** Types generated for queries found in "src/sql/cde-generic.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'CdeGenericGetAllData' parameters type */
export interface ICdeGenericGetAllDataParams {
  cde_name: string;
}

/** 'CdeGenericGetAllData' return type */
export interface ICdeGenericGetAllDataResult {
  block_height: number;
  cde_name: string;
  event_data: Json;
  id: number;
}

/** 'CdeGenericGetAllData' query type */
export interface ICdeGenericGetAllDataQuery {
  params: ICdeGenericGetAllDataParams;
  result: ICdeGenericGetAllDataResult;
}

const cdeGenericGetAllDataIR: any = {"usedParamSet":{"cde_name":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":48,"b":57}]}],"statement":"SELECT * FROM cde_generic_data\nWHERE cde_name = :cde_name!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_generic_data
 * WHERE cde_name = :cde_name!
 * ```
 */
export const cdeGenericGetAllData = new PreparedQuery<ICdeGenericGetAllDataParams,ICdeGenericGetAllDataResult>(cdeGenericGetAllDataIR);


/** 'CdeGenericGetBlockheightData' parameters type */
export interface ICdeGenericGetBlockheightDataParams {
  block_height: number;
  cde_name: string;
}

/** 'CdeGenericGetBlockheightData' return type */
export interface ICdeGenericGetBlockheightDataResult {
  block_height: number;
  cde_name: string;
  event_data: Json;
  id: number;
}

/** 'CdeGenericGetBlockheightData' query type */
export interface ICdeGenericGetBlockheightDataQuery {
  params: ICdeGenericGetBlockheightDataParams;
  result: ICdeGenericGetBlockheightDataResult;
}

const cdeGenericGetBlockheightDataIR: any = {"usedParamSet":{"cde_name":true,"block_height":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":48,"b":57}]},{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":78,"b":91}]}],"statement":"SELECT * FROM cde_generic_data\nWHERE cde_name = :cde_name!\nAND block_height = :block_height!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_generic_data
 * WHERE cde_name = :cde_name!
 * AND block_height = :block_height!
 * ```
 */
export const cdeGenericGetBlockheightData = new PreparedQuery<ICdeGenericGetBlockheightDataParams,ICdeGenericGetBlockheightDataResult>(cdeGenericGetBlockheightDataIR);


/** 'CdeGenericGetRangeData' parameters type */
export interface ICdeGenericGetRangeDataParams {
  cde_name: string;
  from_block: number;
  to_block: number;
}

/** 'CdeGenericGetRangeData' return type */
export interface ICdeGenericGetRangeDataResult {
  block_height: number;
  cde_name: string;
  event_data: Json;
  id: number;
}

/** 'CdeGenericGetRangeData' query type */
export interface ICdeGenericGetRangeDataQuery {
  params: ICdeGenericGetRangeDataParams;
  result: ICdeGenericGetRangeDataResult;
}

const cdeGenericGetRangeDataIR: any = {"usedParamSet":{"cde_name":true,"from_block":true,"to_block":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":48,"b":57}]},{"name":"from_block","required":true,"transform":{"type":"scalar"},"locs":[{"a":79,"b":90}]},{"name":"to_block","required":true,"transform":{"type":"scalar"},"locs":[{"a":112,"b":121}]}],"statement":"SELECT * FROM cde_generic_data\nWHERE cde_name = :cde_name!\nAND block_height >= :from_block!\nAND block_height <= :to_block!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_generic_data
 * WHERE cde_name = :cde_name!
 * AND block_height >= :from_block!
 * AND block_height <= :to_block!
 * ```
 */
export const cdeGenericGetRangeData = new PreparedQuery<ICdeGenericGetRangeDataParams,ICdeGenericGetRangeDataResult>(cdeGenericGetRangeDataIR);


/** 'CdeGenericInsertData' parameters type */
export interface ICdeGenericInsertDataParams {
  block_height: number;
  cde_name: string;
  event_data: Json;
}

/** 'CdeGenericInsertData' return type */
export type ICdeGenericInsertDataResult = void;

/** 'CdeGenericInsertData' query type */
export interface ICdeGenericInsertDataQuery {
  params: ICdeGenericInsertDataParams;
  result: ICdeGenericInsertDataResult;
}

const cdeGenericInsertDataIR: any = {"usedParamSet":{"cde_name":true,"block_height":true,"event_data":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":92,"b":101}]},{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":108,"b":121}]},{"name":"event_data","required":true,"transform":{"type":"scalar"},"locs":[{"a":128,"b":139}]}],"statement":"INSERT INTO cde_generic_data(\n    cde_name,\n    block_height,\n    event_data\n) VALUES (\n    :cde_name!,\n    :block_height!,\n    :event_data!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_generic_data(
 *     cde_name,
 *     block_height,
 *     event_data
 * ) VALUES (
 *     :cde_name!,
 *     :block_height!,
 *     :event_data!
 * )
 * ```
 */
export const cdeGenericInsertData = new PreparedQuery<ICdeGenericInsertDataParams,ICdeGenericInsertDataResult>(cdeGenericInsertDataIR);


