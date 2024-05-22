/** Types generated for queries found in "src/sql/dynamic-primitives.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetDynamicExtensions' parameters type */
export type IGetDynamicExtensionsParams = void;

/** 'GetDynamicExtensions' return type */
export interface IGetDynamicExtensionsResult {
  cde_name: string;
  config: string;
  parent: string;
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


/** 'GetDynamicExtensionsByParent' parameters type */
export interface IGetDynamicExtensionsByParentParams {
  parent: string;
}

/** 'GetDynamicExtensionsByParent' return type */
export interface IGetDynamicExtensionsByParentResult {
  cde_name: string;
  config: string;
  parent: string;
}

/** 'GetDynamicExtensionsByParent' query type */
export interface IGetDynamicExtensionsByParentQuery {
  params: IGetDynamicExtensionsByParentParams;
  result: IGetDynamicExtensionsByParentResult;
}

const getDynamicExtensionsByParentIR: any = {"usedParamSet":{"parent":true},"params":[{"name":"parent","required":true,"transform":{"type":"scalar"},"locs":[{"a":58,"b":65}]}],"statement":"SELECT * FROM cde_dynamic_primitive_config\nWHERE parent = :parent!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_dynamic_primitive_config
 * WHERE parent = :parent!
 * ```
 */
export const getDynamicExtensionsByParent = new PreparedQuery<IGetDynamicExtensionsByParentParams,IGetDynamicExtensionsByParentResult>(getDynamicExtensionsByParentIR);


/** 'InsertDynamicExtension' parameters type */
export interface IInsertDynamicExtensionParams {
  base_name: string;
  config: string;
  parent_name: string;
}

/** 'InsertDynamicExtension' return type */
export type IInsertDynamicExtensionResult = void;

/** 'InsertDynamicExtension' query type */
export interface IInsertDynamicExtensionQuery {
  params: IInsertDynamicExtensionParams;
  result: IInsertDynamicExtensionResult;
}

const insertDynamicExtensionIR: any = {"usedParamSet":{"base_name":true,"parent_name":true,"config":true},"params":[{"name":"base_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":94,"b":104},{"a":217,"b":227}]},{"name":"parent_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":123,"b":135}]},{"name":"config","required":true,"transform":{"type":"scalar"},"locs":[{"a":142,"b":149}]}],"statement":"INSERT INTO cde_dynamic_primitive_config(\n    cde_name,\n    parent,\n    config\n) \nSELECT \n    :base_name! || COUNT(*),\n    :parent_name!,\n    :config!\nFROM\n    cde_dynamic_primitive_config\nWHERE starts_with(cde_name, :base_name!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_dynamic_primitive_config(
 *     cde_name,
 *     parent,
 *     config
 * ) 
 * SELECT 
 *     :base_name! || COUNT(*),
 *     :parent_name!,
 *     :config!
 * FROM
 *     cde_dynamic_primitive_config
 * WHERE starts_with(cde_name, :base_name!)
 * ```
 */
export const insertDynamicExtension = new PreparedQuery<IInsertDynamicExtensionParams,IInsertDynamicExtensionResult>(insertDynamicExtensionIR);


