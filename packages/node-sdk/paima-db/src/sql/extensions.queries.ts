/** Types generated for queries found in "src/sql/extensions.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetChainDataExtensions' parameters type */
export type IGetChainDataExtensionsParams = void;

/** 'GetChainDataExtensions' return type */
export interface IGetChainDataExtensionsResult {
  cde_hash: number | null;
  cde_id: number;
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
  cde_id?: number | null | void;
}

/** 'GetSpecificChainDataExtension' return type */
export interface IGetSpecificChainDataExtensionResult {
  cde_hash: number | null;
  cde_id: number;
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

const getSpecificChainDataExtensionIR: any = {"usedParamSet":{"cde_id":true},"params":[{"name":"cde_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":51,"b":57}]}],"statement":"SELECT * FROM chain_data_extensions\nWHERE cde_id = :cde_id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM chain_data_extensions
 * WHERE cde_id = :cde_id
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
  cde_id: number;
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
  cde_id?: number | null | void;
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

const registerChainDataExtensionIR: any = {"usedParamSet":{"cde_id":true,"cde_type":true,"cde_name":true,"cde_hash":true,"start_blockheight":true,"scheduled_prefix":true},"params":[{"name":"cde_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":188,"b":194}]},{"name":"cde_type","required":true,"transform":{"type":"scalar"},"locs":[{"a":241,"b":250}]},{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":257,"b":266}]},{"name":"cde_hash","required":true,"transform":{"type":"scalar"},"locs":[{"a":273,"b":282}]},{"name":"start_blockheight","required":true,"transform":{"type":"scalar"},"locs":[{"a":289,"b":307}]},{"name":"scheduled_prefix","required":false,"transform":{"type":"scalar"},"locs":[{"a":314,"b":330}]}],"statement":"INSERT INTO\n    chain_data_extensions (\n        CDE_ID,\n        CDE_TYPE,\n        CDE_NAME,\n        CDE_HASH,\n        START_BLOCKHEIGHT,\n        SCHEDULED_PREFIX\n    )\nSELECT\n    COALESCE(:cde_id, MAX(chain_data_extensions.cde_id) + 1),\n    :cde_type!,\n    :cde_name!,\n    :cde_hash!,\n    :start_blockheight!,\n    :scheduled_prefix\nFROM\n    chain_data_extensions"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO
 *     chain_data_extensions (
 *         CDE_ID,
 *         CDE_TYPE,
 *         CDE_NAME,
 *         CDE_HASH,
 *         START_BLOCKHEIGHT,
 *         SCHEDULED_PREFIX
 *     )
 * SELECT
 *     COALESCE(:cde_id, MAX(chain_data_extensions.cde_id) + 1),
 *     :cde_type!,
 *     :cde_name!,
 *     :cde_hash!,
 *     :start_blockheight!,
 *     :scheduled_prefix
 * FROM
 *     chain_data_extensions
 * ```
 */
export const registerChainDataExtension = new PreparedQuery<IRegisterChainDataExtensionParams,IRegisterChainDataExtensionResult>(registerChainDataExtensionIR);


