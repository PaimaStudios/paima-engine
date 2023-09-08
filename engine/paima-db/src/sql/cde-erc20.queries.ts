/** Types generated for queries found in "src/sql/cde-erc20.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'CdeErc20GetBalance' parameters type */
export interface ICdeErc20GetBalanceParams {
  cde_id: number;
  wallet_address: string;
}

/** 'CdeErc20GetBalance' return type */
export interface ICdeErc20GetBalanceResult {
  balance: string;
  cde_id: number;
  wallet_address: string;
}

/** 'CdeErc20GetBalance' query type */
export interface ICdeErc20GetBalanceQuery {
  params: ICdeErc20GetBalanceParams;
  result: ICdeErc20GetBalanceResult;
}

const cdeErc20GetBalanceIR: any = {"usedParamSet":{"cde_id":true,"wallet_address":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":44,"b":51}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":74,"b":89}]}],"statement":"SELECT * FROM cde_erc20_data\nWHERE cde_id = :cde_id!\nAND wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc20_data
 * WHERE cde_id = :cde_id!
 * AND wallet_address = :wallet_address!
 * ```
 */
export const cdeErc20GetBalance = new PreparedQuery<ICdeErc20GetBalanceParams,ICdeErc20GetBalanceResult>(cdeErc20GetBalanceIR);


/** 'CdeErc20InsertBalance' parameters type */
export interface ICdeErc20InsertBalanceParams {
  balance: string;
  cde_id: number;
  wallet_address: string;
}

/** 'CdeErc20InsertBalance' return type */
export type ICdeErc20InsertBalanceResult = void;

/** 'CdeErc20InsertBalance' query type */
export interface ICdeErc20InsertBalanceQuery {
  params: ICdeErc20InsertBalanceParams;
  result: ICdeErc20InsertBalanceResult;
}

const cdeErc20InsertBalanceIR: any = {"usedParamSet":{"cde_id":true,"wallet_address":true,"balance":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":87,"b":94}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":101,"b":116}]},{"name":"balance","required":true,"transform":{"type":"scalar"},"locs":[{"a":123,"b":131}]}],"statement":"INSERT INTO cde_erc20_data(\n    cde_id,\n    wallet_address,\n    balance\n) VALUES (\n    :cde_id!,\n    :wallet_address!,\n    :balance!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_erc20_data(
 *     cde_id,
 *     wallet_address,
 *     balance
 * ) VALUES (
 *     :cde_id!,
 *     :wallet_address!,
 *     :balance!
 * )
 * ```
 */
export const cdeErc20InsertBalance = new PreparedQuery<ICdeErc20InsertBalanceParams,ICdeErc20InsertBalanceResult>(cdeErc20InsertBalanceIR);


/** 'CdeErc20UpdateBalance' parameters type */
export interface ICdeErc20UpdateBalanceParams {
  balance: string;
  cde_id: number;
  wallet_address: string;
}

/** 'CdeErc20UpdateBalance' return type */
export type ICdeErc20UpdateBalanceResult = void;

/** 'CdeErc20UpdateBalance' query type */
export interface ICdeErc20UpdateBalanceQuery {
  params: ICdeErc20UpdateBalanceParams;
  result: ICdeErc20UpdateBalanceResult;
}

const cdeErc20UpdateBalanceIR: any = {"usedParamSet":{"balance":true,"cde_id":true,"wallet_address":true},"params":[{"name":"balance","required":true,"transform":{"type":"scalar"},"locs":[{"a":40,"b":48}]},{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":65,"b":72}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":95,"b":110}]}],"statement":"UPDATE cde_erc20_data\nSET\n    balance = :balance!\nWHERE cde_id = :cde_id!\nAND wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE cde_erc20_data
 * SET
 *     balance = :balance!
 * WHERE cde_id = :cde_id!
 * AND wallet_address = :wallet_address!
 * ```
 */
export const cdeErc20UpdateBalance = new PreparedQuery<ICdeErc20UpdateBalanceParams,ICdeErc20UpdateBalanceResult>(cdeErc20UpdateBalanceIR);


