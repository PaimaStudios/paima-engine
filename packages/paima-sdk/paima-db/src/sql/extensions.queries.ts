/** Types generated for queries found in "src/sql/extensions.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetChainDataExtensions' parameters type */
export type IGetChainDataExtensionsParams = void;

/** 'GetChainDataExtensions' return type */
export interface IGetChainDataExtensionsResult {
  cde_id: number;
  cde_name: string;
  cde_type: number;
  contract_address: string;
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
  cde_id: number;
  cde_name: string;
  cde_type: number;
  contract_address: string;
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
  cde_id: number;
  cde_name: string;
  cde_type: number;
  contract_address: string;
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


/** 'SelectChainDataExtensionsByTypeAndAddress' parameters type */
export interface ISelectChainDataExtensionsByTypeAndAddressParams {
  cde_type: number;
  contract_address: string;
}

/** 'SelectChainDataExtensionsByTypeAndAddress' return type */
export interface ISelectChainDataExtensionsByTypeAndAddressResult {
  cde_id: number;
  cde_name: string;
  cde_type: number;
  contract_address: string;
  scheduled_prefix: string | null;
  start_blockheight: number;
}

/** 'SelectChainDataExtensionsByTypeAndAddress' query type */
export interface ISelectChainDataExtensionsByTypeAndAddressQuery {
  params: ISelectChainDataExtensionsByTypeAndAddressParams;
  result: ISelectChainDataExtensionsByTypeAndAddressResult;
}

const selectChainDataExtensionsByTypeAndAddressIR: any = {"usedParamSet":{"cde_type":true,"contract_address":true},"params":[{"name":"cde_type","required":true,"transform":{"type":"scalar"},"locs":[{"a":53,"b":62}]},{"name":"contract_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":87,"b":104}]}],"statement":"SELECT * FROM chain_data_extensions\nWHERE cde_type = :cde_type!\nAND contract_address = :contract_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM chain_data_extensions
 * WHERE cde_type = :cde_type!
 * AND contract_address = :contract_address!
 * ```
 */
export const selectChainDataExtensionsByTypeAndAddress = new PreparedQuery<ISelectChainDataExtensionsByTypeAndAddressParams,ISelectChainDataExtensionsByTypeAndAddressResult>(selectChainDataExtensionsByTypeAndAddressIR);


/** 'SelectChainDataExtensionsByAddress' parameters type */
export interface ISelectChainDataExtensionsByAddressParams {
  contract_address: string;
}

/** 'SelectChainDataExtensionsByAddress' return type */
export interface ISelectChainDataExtensionsByAddressResult {
  cde_id: number;
  cde_name: string;
  cde_type: number;
  contract_address: string;
  scheduled_prefix: string | null;
  start_blockheight: number;
}

/** 'SelectChainDataExtensionsByAddress' query type */
export interface ISelectChainDataExtensionsByAddressQuery {
  params: ISelectChainDataExtensionsByAddressParams;
  result: ISelectChainDataExtensionsByAddressResult;
}

const selectChainDataExtensionsByAddressIR: any = {"usedParamSet":{"contract_address":true},"params":[{"name":"contract_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":61,"b":78}]}],"statement":"SELECT * FROM chain_data_extensions\nWHERE contract_address = :contract_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM chain_data_extensions
 * WHERE contract_address = :contract_address!
 * ```
 */
export const selectChainDataExtensionsByAddress = new PreparedQuery<ISelectChainDataExtensionsByAddressParams,ISelectChainDataExtensionsByAddressResult>(selectChainDataExtensionsByAddressIR);


/** 'RegisterChainDataExtension' parameters type */
export interface IRegisterChainDataExtensionParams {
  cde_id: number;
  cde_name: string;
  cde_type: number;
  contract_address: string;
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

const registerChainDataExtensionIR: any = {"usedParamSet":{"cde_id":true,"cde_type":true,"cde_name":true,"contract_address":true,"start_blockheight":true,"scheduled_prefix":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":156,"b":163}]},{"name":"cde_type","required":true,"transform":{"type":"scalar"},"locs":[{"a":170,"b":179}]},{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":186,"b":195}]},{"name":"contract_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":202,"b":219}]},{"name":"start_blockheight","required":true,"transform":{"type":"scalar"},"locs":[{"a":226,"b":244}]},{"name":"scheduled_prefix","required":false,"transform":{"type":"scalar"},"locs":[{"a":251,"b":267}]}],"statement":"INSERT INTO chain_data_extensions(\n    cde_id,\n    cde_type,\n    cde_name,\n    contract_address,\n    start_blockheight,\n    scheduled_prefix\n) VALUES (\n    :cde_id!,\n    :cde_type!,\n    :cde_name!,\n    :contract_address!,\n    :start_blockheight!,\n    :scheduled_prefix\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO chain_data_extensions(
 *     cde_id,
 *     cde_type,
 *     cde_name,
 *     contract_address,
 *     start_blockheight,
 *     scheduled_prefix
 * ) VALUES (
 *     :cde_id!,
 *     :cde_type!,
 *     :cde_name!,
 *     :contract_address!,
 *     :start_blockheight!,
 *     :scheduled_prefix
 * )
 * ```
 */
export const registerChainDataExtension = new PreparedQuery<IRegisterChainDataExtensionParams,IRegisterChainDataExtensionResult>(registerChainDataExtensionIR);


