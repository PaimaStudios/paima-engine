/** Types generated for queries found in "src/sql/extensions.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetChainDataExtensions' parameters type */
export type IGetChainDataExtensionsParams = void;

/** 'GetChainDataExtensions' return type */
export interface IGetChainDataExtensionsResult {
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

const registerChainDataExtensionIR: any = {"usedParamSet":{"cde_type":true,"cde_name":true,"cde_hash":true,"start_blockheight":true,"scheduled_prefix":true},"params":[{"name":"cde_type","required":true,"transform":{"type":"scalar"},"locs":[{"a":165,"b":174}]},{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":181,"b":190}]},{"name":"cde_hash","required":true,"transform":{"type":"scalar"},"locs":[{"a":197,"b":206}]},{"name":"start_blockheight","required":true,"transform":{"type":"scalar"},"locs":[{"a":213,"b":231}]},{"name":"scheduled_prefix","required":false,"transform":{"type":"scalar"},"locs":[{"a":238,"b":254}]}],"statement":"INSERT INTO\n    chain_data_extensions (\n        CDE_TYPE,\n        CDE_NAME,\n        CDE_HASH,\n        START_BLOCKHEIGHT,\n        SCHEDULED_PREFIX\n    )\nVALUES (\n    :cde_type!,\n    :cde_name!,\n    :cde_hash!,\n    :start_blockheight!,\n    :scheduled_prefix\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO
 *     chain_data_extensions (
 *         CDE_TYPE,
 *         CDE_NAME,
 *         CDE_HASH,
 *         START_BLOCKHEIGHT,
 *         SCHEDULED_PREFIX
 *     )
 * VALUES (
 *     :cde_type!,
 *     :cde_name!,
 *     :cde_hash!,
 *     :start_blockheight!,
 *     :scheduled_prefix
 * )
 * ```
 */
export const registerChainDataExtension = new PreparedQuery<IRegisterChainDataExtensionParams,IRegisterChainDataExtensionResult>(registerChainDataExtensionIR);


/** 'RegisterDynamicChainDataExtension' parameters type */
export interface IRegisterDynamicChainDataExtensionParams {
  base_name: string;
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

const registerDynamicChainDataExtensionIR: any = {"usedParamSet":{"base_name":true,"cde_type":true,"start_blockheight":true,"scheduled_prefix":true},"params":[{"name":"base_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":146,"b":156},{"a":294,"b":304}]},{"name":"cde_type","required":true,"transform":{"type":"scalar"},"locs":[{"a":175,"b":184}]},{"name":"start_blockheight","required":true,"transform":{"type":"scalar"},"locs":[{"a":191,"b":209}]},{"name":"scheduled_prefix","required":true,"transform":{"type":"scalar"},"locs":[{"a":216,"b":233}]}],"statement":"INSERT INTO\n    chain_data_extensions (\n        CDE_NAME,\n        CDE_TYPE,\n        START_BLOCKHEIGHT,\n        SCHEDULED_PREFIX\n    )\nSELECT \n    :base_name! || COUNT(*),\n    :cde_type!,\n    :start_blockheight!,\n    :scheduled_prefix!\nFROM\n    chain_data_extensions\nWHERE starts_with(cde_name, :base_name!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO
 *     chain_data_extensions (
 *         CDE_NAME,
 *         CDE_TYPE,
 *         START_BLOCKHEIGHT,
 *         SCHEDULED_PREFIX
 *     )
 * SELECT 
 *     :base_name! || COUNT(*),
 *     :cde_type!,
 *     :start_blockheight!,
 *     :scheduled_prefix!
 * FROM
 *     chain_data_extensions
 * WHERE starts_with(cde_name, :base_name!)
 * ```
 */
export const registerDynamicChainDataExtension = new PreparedQuery<IRegisterDynamicChainDataExtensionParams,IRegisterDynamicChainDataExtensionResult>(registerDynamicChainDataExtensionIR);


