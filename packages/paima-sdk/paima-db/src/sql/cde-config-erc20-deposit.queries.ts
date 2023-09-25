/** Types generated for queries found in "src/sql/cde-config-erc20-deposit.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetCdeConfigErc20Deposit' parameters type */
export type IGetCdeConfigErc20DepositParams = void;

/** 'GetCdeConfigErc20Deposit' return type */
export interface IGetCdeConfigErc20DepositResult {
  cde_id: number;
  deposit_address: string;
}

/** 'GetCdeConfigErc20Deposit' query type */
export interface IGetCdeConfigErc20DepositQuery {
  params: IGetCdeConfigErc20DepositParams;
  result: IGetCdeConfigErc20DepositResult;
}

const getCdeConfigErc20DepositIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM cde_config_erc20_deposit"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_config_erc20_deposit
 * ```
 */
export const getCdeConfigErc20Deposit = new PreparedQuery<IGetCdeConfigErc20DepositParams,IGetCdeConfigErc20DepositResult>(getCdeConfigErc20DepositIR);


/** 'GetSpecificCdeConfigErc20Deposit' parameters type */
export interface IGetSpecificCdeConfigErc20DepositParams {
  cde_id?: number | null | void;
}

/** 'GetSpecificCdeConfigErc20Deposit' return type */
export interface IGetSpecificCdeConfigErc20DepositResult {
  cde_id: number;
  deposit_address: string;
}

/** 'GetSpecificCdeConfigErc20Deposit' query type */
export interface IGetSpecificCdeConfigErc20DepositQuery {
  params: IGetSpecificCdeConfigErc20DepositParams;
  result: IGetSpecificCdeConfigErc20DepositResult;
}

const getSpecificCdeConfigErc20DepositIR: any = {"usedParamSet":{"cde_id":true},"params":[{"name":"cde_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":54,"b":60}]}],"statement":"SELECT * FROM cde_config_erc20_deposit\nWHERE cde_id = :cde_id"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_config_erc20_deposit
 * WHERE cde_id = :cde_id
 * ```
 */
export const getSpecificCdeConfigErc20Deposit = new PreparedQuery<IGetSpecificCdeConfigErc20DepositParams,IGetSpecificCdeConfigErc20DepositResult>(getSpecificCdeConfigErc20DepositIR);


/** 'RegisterCdeConfigErc20Deposit' parameters type */
export interface IRegisterCdeConfigErc20DepositParams {
  cde_id: number;
  deposit_address: string;
}

/** 'RegisterCdeConfigErc20Deposit' return type */
export type IRegisterCdeConfigErc20DepositResult = void;

/** 'RegisterCdeConfigErc20Deposit' query type */
export interface IRegisterCdeConfigErc20DepositQuery {
  params: IRegisterCdeConfigErc20DepositParams;
  result: IRegisterCdeConfigErc20DepositResult;
}

const registerCdeConfigErc20DepositIR: any = {"usedParamSet":{"cde_id":true,"deposit_address":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":85,"b":92}]},{"name":"deposit_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":99,"b":115}]}],"statement":"INSERT INTO cde_config_erc20_deposit(\n    cde_id,\n    deposit_address\n) VALUES (\n    :cde_id!,\n    :deposit_address!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_config_erc20_deposit(
 *     cde_id,
 *     deposit_address
 * ) VALUES (
 *     :cde_id!,
 *     :deposit_address!
 * )
 * ```
 */
export const registerCdeConfigErc20Deposit = new PreparedQuery<IRegisterCdeConfigErc20DepositParams,IRegisterCdeConfigErc20DepositResult>(registerCdeConfigErc20DepositIR);


