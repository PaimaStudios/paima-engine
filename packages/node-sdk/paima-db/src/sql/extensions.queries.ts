/** Types generated for queries found in "src/sql/extensions.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetChainDataExtensions' parameters type */
export type IGetChainDataExtensionsParams = void;

/** 'GetChainDataExtensions' return type */
export interface IGetChainDataExtensionsResult {
  cde_caip2: string;
  cde_hash: number | null;
  cde_name: string;
  cde_type: number;
  scheduled_prefix: string | null;
  start_blockheight: number;
}

/** 'GetChainDataExtensions' query type */
export interface IGetChainDataExtensionsQuery {
  params: IGetChainDataExtensionsParams;
  result: IGetChainDataExtensionsResult;
}

const getChainDataExtensionsIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM chain_data_extensions"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM chain_data_extensions
 * ```
 */
export const getChainDataExtensions = new PreparedQuery<IGetChainDataExtensionsParams,IGetChainDataExtensionsResult>(getChainDataExtensionsIR);


/** 'GetSpecificChainDataExtension' parameters type */
export interface IGetSpecificChainDataExtensionParams {
  cde_name?: string | null | void;
}

/** 'GetSpecificChainDataExtension' return type */
export interface IGetSpecificChainDataExtensionResult {
  cde_caip2: string;
  cde_hash: number | null;
  cde_name: string;
  cde_type: number;
  scheduled_prefix: string | null;
  start_blockheight: number;
}

/** 'GetSpecificChainDataExtension' query type */
export interface IGetSpecificChainDataExtensionQuery {
  params: IGetSpecificChainDataExtensionParams;
  result: IGetSpecificChainDataExtensionResult;
}

const getSpecificChainDataExtensionIR: any = {"usedParamSet":{"cde_name":true},"params":[{"name":"cde_name","required":false,"transform":{"type":"scalar"},"locs":[{"a":53,"b":61}]}],"statement":"SELECT * FROM chain_data_extensions\nWHERE cde_name = :cde_name"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM chain_data_extensions
 * WHERE cde_name = :cde_name
 * ```
 */
export const getSpecificChainDataExtension = new PreparedQuery<IGetSpecificChainDataExtensionParams,IGetSpecificChainDataExtensionResult>(getSpecificChainDataExtensionIR);


/** 'SelectChainDataExtensionsByName' parameters type */
export interface ISelectChainDataExtensionsByNameParams {
  cde_name: string;
}

/** 'SelectChainDataExtensionsByName' return type */
export interface ISelectChainDataExtensionsByNameResult {
  cde_caip2: string;
  cde_hash: number | null;
  cde_name: string;
  cde_type: number;
  scheduled_prefix: string | null;
  start_blockheight: number;
}

/** 'SelectChainDataExtensionsByName' query type */
export interface ISelectChainDataExtensionsByNameQuery {
  params: ISelectChainDataExtensionsByNameParams;
  result: ISelectChainDataExtensionsByNameResult;
}

const selectChainDataExtensionsByNameIR: any = {"usedParamSet":{"cde_name":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":53,"b":62}]}],"statement":"SELECT * FROM chain_data_extensions\nWHERE cde_name = :cde_name!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM chain_data_extensions
 * WHERE cde_name = :cde_name!
 * ```
 */
export const selectChainDataExtensionsByName = new PreparedQuery<ISelectChainDataExtensionsByNameParams,ISelectChainDataExtensionsByNameResult>(selectChainDataExtensionsByNameIR);


/** 'RegisterChainDataExtension' parameters type */
export interface IRegisterChainDataExtensionParams {
  cde_caip2: string;
  cde_hash: number;
  cde_name: string;
  cde_type: number;
  scheduled_prefix?: string | null | void;
  start_blockheight: number;
}

/** 'RegisterChainDataExtension' return type */
export type IRegisterChainDataExtensionResult = void;

/** 'RegisterChainDataExtension' query type */
export interface IRegisterChainDataExtensionQuery {
  params: IRegisterChainDataExtensionParams;
  result: IRegisterChainDataExtensionResult;
}

const registerChainDataExtensionIR: any = {"usedParamSet":{"cde_type":true,"cde_name":true,"cde_hash":true,"cde_caip2":true,"start_blockheight":true,"scheduled_prefix":true},"params":[{"name":"cde_type","required":true,"transform":{"type":"scalar"},"locs":[{"a":184,"b":193}]},{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":200,"b":209}]},{"name":"cde_hash","required":true,"transform":{"type":"scalar"},"locs":[{"a":216,"b":225}]},{"name":"cde_caip2","required":true,"transform":{"type":"scalar"},"locs":[{"a":232,"b":242}]},{"name":"start_blockheight","required":true,"transform":{"type":"scalar"},"locs":[{"a":249,"b":267}]},{"name":"scheduled_prefix","required":false,"transform":{"type":"scalar"},"locs":[{"a":274,"b":290}]}],"statement":"INSERT INTO\n    chain_data_extensions (\n        CDE_TYPE,\n        CDE_NAME,\n        CDE_HASH,\n        CDE_CAIP2,\n        START_BLOCKHEIGHT,\n        SCHEDULED_PREFIX\n    )\nVALUES (\n    :cde_type!,\n    :cde_name!,\n    :cde_hash!,\n    :cde_caip2!,\n    :start_blockheight!,\n    :scheduled_prefix\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO
 *     chain_data_extensions (
 *         CDE_TYPE,
 *         CDE_NAME,
 *         CDE_HASH,
 *         CDE_CAIP2,
 *         START_BLOCKHEIGHT,
 *         SCHEDULED_PREFIX
 *     )
 * VALUES (
 *     :cde_type!,
 *     :cde_name!,
 *     :cde_hash!,
 *     :cde_caip2!,
 *     :start_blockheight!,
 *     :scheduled_prefix
 * )
 * ```
 */
export const registerChainDataExtension = new PreparedQuery<IRegisterChainDataExtensionParams,IRegisterChainDataExtensionResult>(registerChainDataExtensionIR);


/** 'RegisterDynamicChainDataExtension' parameters type */
export interface IRegisterDynamicChainDataExtensionParams {
  base_name: string;
  cde_caip2: string;
  cde_type: number;
  scheduled_prefix: string;
  start_blockheight: number;
}

/** 'RegisterDynamicChainDataExtension' return type */
export type IRegisterDynamicChainDataExtensionResult = void;

/** 'RegisterDynamicChainDataExtension' query type */
export interface IRegisterDynamicChainDataExtensionQuery {
  params: IRegisterDynamicChainDataExtensionParams;
  result: IRegisterDynamicChainDataExtensionResult;
}

const registerDynamicChainDataExtensionIR: any = {"usedParamSet":{"base_name":true,"cde_type":true,"cde_caip2":true,"start_blockheight":true,"scheduled_prefix":true},"params":[{"name":"base_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":165,"b":175},{"a":330,"b":340}]},{"name":"cde_type","required":true,"transform":{"type":"scalar"},"locs":[{"a":194,"b":203}]},{"name":"cde_caip2","required":true,"transform":{"type":"scalar"},"locs":[{"a":210,"b":220}]},{"name":"start_blockheight","required":true,"transform":{"type":"scalar"},"locs":[{"a":227,"b":245}]},{"name":"scheduled_prefix","required":true,"transform":{"type":"scalar"},"locs":[{"a":252,"b":269}]}],"statement":"INSERT INTO\n    chain_data_extensions (\n        CDE_NAME,\n        CDE_TYPE,\n        CDE_CAIP2,\n        START_BLOCKHEIGHT,\n        SCHEDULED_PREFIX\n    )\nSELECT \n    :base_name! || COUNT(*),\n    :cde_type!,\n    :cde_caip2!,\n    :start_blockheight!,\n    :scheduled_prefix!\nFROM\n    chain_data_extensions\nWHERE starts_with(cde_name, :base_name!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO
 *     chain_data_extensions (
 *         CDE_NAME,
 *         CDE_TYPE,
 *         CDE_CAIP2,
 *         START_BLOCKHEIGHT,
 *         SCHEDULED_PREFIX
 *     )
 * SELECT 
 *     :base_name! || COUNT(*),
 *     :cde_type!,
 *     :cde_caip2!,
 *     :start_blockheight!,
 *     :scheduled_prefix!
 * FROM
 *     chain_data_extensions
 * WHERE starts_with(cde_name, :base_name!)
 * ```
 */
export const registerDynamicChainDataExtension = new PreparedQuery<IRegisterDynamicChainDataExtensionParams,IRegisterDynamicChainDataExtensionResult>(registerDynamicChainDataExtensionIR);


