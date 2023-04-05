/** Types generated for queries found in "src/sql/extensions.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'GetChainDataExtensions' parameters type */
export type IGetChainDataExtensionsParams = void;

/** 'GetChainDataExtensions' return type */
export interface IGetChainDataExtensionsResult {
  cde_id: number;
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
  cde_id: number | null | void;
}

/** 'GetSpecificChainDataExtension' return type */
export interface IGetSpecificChainDataExtensionResult {
  cde_id: number;
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


/** 'RegisterChainDataExtension' parameters type */
export interface IRegisterChainDataExtensionParams {
  cde_id: number;
  cde_type: number;
  contract_address: string;
  scheduled_prefix: string | null | void;
  start_blockheight: number;
}

/** 'RegisterChainDataExtension' return type */
export type IRegisterChainDataExtensionResult = void;

/** 'RegisterChainDataExtension' query type */
export interface IRegisterChainDataExtensionQuery {
  params: IRegisterChainDataExtensionParams;
  result: IRegisterChainDataExtensionResult;
}

const registerChainDataExtensionIR: any = {"usedParamSet":{"cde_id":true,"cde_type":true,"contract_address":true,"start_blockheight":true,"scheduled_prefix":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":142,"b":149}]},{"name":"cde_type","required":true,"transform":{"type":"scalar"},"locs":[{"a":156,"b":165}]},{"name":"contract_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":172,"b":189}]},{"name":"start_blockheight","required":true,"transform":{"type":"scalar"},"locs":[{"a":196,"b":214}]},{"name":"scheduled_prefix","required":false,"transform":{"type":"scalar"},"locs":[{"a":221,"b":237}]}],"statement":"INSERT INTO chain_data_extensions(\n    cde_id,\n    cde_type,\n    contract_address,\n    start_blockheight,\n    scheduled_prefix\n) VALUES (\n    :cde_id!,\n    :cde_type!,\n    :contract_address!,\n    :start_blockheight!,\n    :scheduled_prefix\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO chain_data_extensions(
 *     cde_id,
 *     cde_type,
 *     contract_address,
 *     start_blockheight,
 *     scheduled_prefix
 * ) VALUES (
 *     :cde_id!,
 *     :cde_type!,
 *     :contract_address!,
 *     :start_blockheight!,
 *     :scheduled_prefix
 * )
 * ```
 */
export const registerChainDataExtension = new PreparedQuery<IRegisterChainDataExtensionParams,IRegisterChainDataExtensionResult>(registerChainDataExtensionIR);

