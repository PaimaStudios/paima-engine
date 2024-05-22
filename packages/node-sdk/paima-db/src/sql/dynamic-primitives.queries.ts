/** Types generated for queries found in "src/sql/dynamic-primitives.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetDynamicExtensions' parameters type */
export type IGetDynamicExtensionsParams = void;

/** 'GetDynamicExtensions' return type */
export interface IGetDynamicExtensionsResult {
  cde_name: string;
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
  base_name: string;
  config: string;
}

/** 'InsertDynamicExtension' return type */
export type IInsertDynamicExtensionResult = void;

/** 'InsertDynamicExtension' query type */
export interface IInsertDynamicExtensionQuery {
  params: IInsertDynamicExtensionParams;
  result: IInsertDynamicExtensionResult;
}

const insertDynamicExtensionIR: any = {"usedParamSet":{"base_name":true,"config":true},"params":[{"name":"base_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":82,"b":92},{"a":186,"b":196}]},{"name":"config","required":true,"transform":{"type":"scalar"},"locs":[{"a":111,"b":118}]}],"statement":"INSERT INTO cde_dynamic_primitive_config(\n    cde_name,\n    config\n) \nSELECT \n    :base_name! || COUNT(*),\n    :config!\nFROM\n    cde_dynamic_primitive_config\nWHERE starts_with(cde_name, :base_name!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_dynamic_primitive_config(
 *     cde_name,
 *     config
 * ) 
 * SELECT 
 *     :base_name! || COUNT(*),
 *     :config!
 * FROM
 *     cde_dynamic_primitive_config
 * WHERE starts_with(cde_name, :base_name!)
 * ```
 */
export const insertDynamicExtension = new PreparedQuery<IInsertDynamicExtensionParams,IInsertDynamicExtensionResult>(insertDynamicExtensionIR);


