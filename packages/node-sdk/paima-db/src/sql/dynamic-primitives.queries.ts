/** Types generated for queries found in "src/sql/dynamic-primitives.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetDynamicExtensions' parameters type */
export type IGetDynamicExtensionsParams = void;

/** 'GetDynamicExtensions' return type */
export interface IGetDynamicExtensionsResult {
  cde_id: number;
  config: string;
}

/** 'GetDynamicExtensions' query type */
export interface IGetDynamicExtensionsQuery {
  params: IGetDynamicExtensionsParams;
  result: IGetDynamicExtensionsResult;
}

const getDynamicExtensionsIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM cde_dynamic_primitive_config"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_dynamic_primitive_config
 * ```
 */
export const getDynamicExtensions = new PreparedQuery<IGetDynamicExtensionsParams,IGetDynamicExtensionsResult>(getDynamicExtensionsIR);


/** 'InsertDynamicExtension' parameters type */
export interface IInsertDynamicExtensionParams {
  cde_id: number;
  config: string;
}

/** 'InsertDynamicExtension' return type */
export type IInsertDynamicExtensionResult = void;

/** 'InsertDynamicExtension' query type */
export interface IInsertDynamicExtensionQuery {
  params: IInsertDynamicExtensionParams;
  result: IInsertDynamicExtensionResult;
}

const insertDynamicExtensionIR: any = {"usedParamSet":{"cde_id":true,"config":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":80,"b":87}]},{"name":"config","required":true,"transform":{"type":"scalar"},"locs":[{"a":94,"b":101}]}],"statement":"INSERT INTO cde_dynamic_primitive_config(\n    cde_id,\n    config\n) VALUES (\n    :cde_id!,\n    :config!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_dynamic_primitive_config(
 *     cde_id,
 *     config
 * ) VALUES (
 *     :cde_id!,
 *     :config!
 * )
 * ```
 */
export const insertDynamicExtension = new PreparedQuery<IInsertDynamicExtensionParams,IInsertDynamicExtensionResult>(insertDynamicExtensionIR);


