/** Types generated for queries found in "src/sql/cde-config-generic.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetCdeConfigGeneric' parameters type */
export type IGetCdeConfigGenericParams = void;

/** 'GetCdeConfigGeneric' return type */
export interface IGetCdeConfigGenericResult {
  cde_id: number;
  contract_abi: string;
  event_signature: string;
}

/** 'GetCdeConfigGeneric' query type */
export interface IGetCdeConfigGenericQuery {
  params: IGetCdeConfigGenericParams;
  result: IGetCdeConfigGenericResult;
}

const getCdeConfigGenericIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM cde_config_generic"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_config_generic
 * ```
 */
export const getCdeConfigGeneric = new PreparedQuery<IGetCdeConfigGenericParams,IGetCdeConfigGenericResult>(getCdeConfigGenericIR);


/** 'GetSpecificCdeConfigGeneric' parameters type */
export interface IGetSpecificCdeConfigGenericParams {
  cde_id?: number | null | void;
}

/** 'GetSpecificCdeConfigGeneric' return type */
export interface IGetSpecificCdeConfigGenericResult {
  cde_id: number;
  contract_abi: string;
  event_signature: string;
}

/** 'GetSpecificCdeConfigGeneric' query type */
export interface IGetSpecificCdeConfigGenericQuery {
  params: IGetSpecificCdeConfigGenericParams;
  result: IGetSpecificCdeConfigGenericResult;
}

const getSpecificCdeConfigGenericIR: any = {"usedParamSet":{"cde_id":true},"params":[{"name":"cde_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":48,"b":54}]}],"statement":"SELECT * FROM cde_config_generic\nWHERE cde_id = :cde_id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_config_generic
 * WHERE cde_id = :cde_id
 * ```
 */
export const getSpecificCdeConfigGeneric = new PreparedQuery<IGetSpecificCdeConfigGenericParams,IGetSpecificCdeConfigGenericResult>(getSpecificCdeConfigGenericIR);


/** 'RegisterCdeConfigGeneric' parameters type */
export interface IRegisterCdeConfigGenericParams {
  cde_id: number;
  contract_abi: string;
  event_signature: string;
}

/** 'RegisterCdeConfigGeneric' return type */
export type IRegisterCdeConfigGenericResult = void;

/** 'RegisterCdeConfigGeneric' query type */
export interface IRegisterCdeConfigGenericQuery {
  params: IRegisterCdeConfigGenericParams;
  result: IRegisterCdeConfigGenericResult;
}

const registerCdeConfigGenericIR: any = {"usedParamSet":{"cde_id":true,"event_signature":true,"contract_abi":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":97,"b":104}]},{"name":"event_signature","required":true,"transform":{"type":"scalar"},"locs":[{"a":111,"b":127}]},{"name":"contract_abi","required":true,"transform":{"type":"scalar"},"locs":[{"a":134,"b":147}]}],"statement":"INSERT INTO cde_config_generic(\n    cde_id,\n    event_signature,\n    contract_abi\n) VALUES (\n    :cde_id!,\n    :event_signature!,\n    :contract_abi!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_config_generic(
 *     cde_id,
 *     event_signature,
 *     contract_abi
 * ) VALUES (
 *     :cde_id!,
 *     :event_signature!,
 *     :contract_abi!
 * )
 * ```
 */
export const registerCdeConfigGeneric = new PreparedQuery<IRegisterCdeConfigGenericParams,IRegisterCdeConfigGenericResult>(registerCdeConfigGenericIR);


