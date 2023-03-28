/** Types generated for queries found in "src/sql/extensions.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'GetChainDataExtensions' parameters type */
export type IGetChainDataExtensionsParams = void;

/** 'GetChainDataExtensions' return type */
export interface IGetChainDataExtensionsResult {
  cde_id: number;
  cde_type: number;
  contract_address: string;
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


/** 'RegisterChainDataExtension' parameters type */
export interface IRegisterChainDataExtensionParams {
  cde_id: number;
  cde_type: number;
  contract_address: string;
  start_blockheight: number;
}

/** 'RegisterChainDataExtension' return type */
export type IRegisterChainDataExtensionResult = void;

/** 'RegisterChainDataExtension' query type */
export interface IRegisterChainDataExtensionQuery {
  params: IRegisterChainDataExtensionParams;
  result: IRegisterChainDataExtensionResult;
}

const registerChainDataExtensionIR: any = {"usedParamSet":{"cde_id":true,"cde_type":true,"contract_address":true,"start_blockheight":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":120,"b":127}]},{"name":"cde_type","required":true,"transform":{"type":"scalar"},"locs":[{"a":134,"b":143}]},{"name":"contract_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":150,"b":167}]},{"name":"start_blockheight","required":true,"transform":{"type":"scalar"},"locs":[{"a":174,"b":192}]}],"statement":"INSERT INTO chain_data_extensions(\n    cde_id,\n    cde_type,\n    contract_address,\n    start_blockheight\n) VALUES (\n    :cde_id!,\n    :cde_type!,\n    :contract_address!,\n    :start_blockheight!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO chain_data_extensions(
 *     cde_id,
 *     cde_type,
 *     contract_address,
 *     start_blockheight
 * ) VALUES (
 *     :cde_id!,
 *     :cde_type!,
 *     :contract_address!,
 *     :start_blockheight!
 * )
 * ```
 */
export const registerChainDataExtension = new PreparedQuery<IRegisterChainDataExtensionParams,IRegisterChainDataExtensionResult>(registerChainDataExtensionIR);


