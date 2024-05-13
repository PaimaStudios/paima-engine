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
  config: string;
}

/** 'InsertDynamicExtension' return type */
export type IInsertDynamicExtensionResult = void;

/** 'InsertDynamicExtension' query type */
export interface IInsertDynamicExtensionQuery {
  params: IInsertDynamicExtensionParams;
  result: IInsertDynamicExtensionResult;
}

const insertDynamicExtensionIR: any = {"usedParamSet":{"config":true},"params":[{"name":"config","required":true,"transform":{"type":"scalar"},"locs":[{"a":119,"b":126}]}],"statement":"INSERT INTO cde_dynamic_primitive_config(\n    cde_id,\n    config\n) \nSELECT \n    MAX(chain_data_extensions.cde_id),\n    :config!\nFROM\n    chain_data_extensions"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_dynamic_primitive_config(
 *     cde_id,
 *     config
 * ) 
 * SELECT 
 *     MAX(chain_data_extensions.cde_id),
 *     :config!
 * FROM
 *     chain_data_extensions
 * ```
 */
export const insertDynamicExtension = new PreparedQuery<IInsertDynamicExtensionParams,IInsertDynamicExtensionResult>(insertDynamicExtensionIR);


