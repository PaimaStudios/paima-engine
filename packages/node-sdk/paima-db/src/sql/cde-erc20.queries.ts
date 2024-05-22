/** Types generated for queries found in "src/sql/cde-erc20.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CdeErc20GetBalance' parameters type */
export interface ICdeErc20GetBalanceParams {
  cde_name: string;
  wallet_address: string;
}

/** 'CdeErc20GetBalance' return type */
export interface ICdeErc20GetBalanceResult {
  balance: string;
  cde_name: string;
  wallet_address: string;
}

/** 'CdeErc20GetBalance' query type */
export interface ICdeErc20GetBalanceQuery {
  params: ICdeErc20GetBalanceParams;
  result: ICdeErc20GetBalanceResult;
}

const cdeErc20GetBalanceIR: any = {"usedParamSet":{"cde_name":true,"wallet_address":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":46,"b":55}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":78,"b":93}]}],"statement":"SELECT * FROM cde_erc20_data\nWHERE cde_name = :cde_name!\nAND wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc20_data
 * WHERE cde_name = :cde_name!
 * AND wallet_address = :wallet_address!
 * ```
 */
export const cdeErc20GetBalance = new PreparedQuery<ICdeErc20GetBalanceParams,ICdeErc20GetBalanceResult>(cdeErc20GetBalanceIR);


/** 'CdeErc20InsertBalance' parameters type */
export interface ICdeErc20InsertBalanceParams {
  balance: string;
  cde_name: string;
  wallet_address: string;
}

/** 'CdeErc20InsertBalance' return type */
export type ICdeErc20InsertBalanceResult = void;

/** 'CdeErc20InsertBalance' query type */
export interface ICdeErc20InsertBalanceQuery {
  params: ICdeErc20InsertBalanceParams;
  result: ICdeErc20InsertBalanceResult;
}

const cdeErc20InsertBalanceIR: any = {"usedParamSet":{"cde_name":true,"wallet_address":true,"balance":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":89,"b":98}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":105,"b":120}]},{"name":"balance","required":true,"transform":{"type":"scalar"},"locs":[{"a":127,"b":135}]}],"statement":"INSERT INTO cde_erc20_data(\n    cde_name,\n    wallet_address,\n    balance\n) VALUES (\n    :cde_name!,\n    :wallet_address!,\n    :balance!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_erc20_data(
 *     cde_name,
 *     wallet_address,
 *     balance
 * ) VALUES (
 *     :cde_name!,
 *     :wallet_address!,
 *     :balance!
 * )
 * ```
 */
export const cdeErc20InsertBalance = new PreparedQuery<ICdeErc20InsertBalanceParams,ICdeErc20InsertBalanceResult>(cdeErc20InsertBalanceIR);


/** 'CdeErc20UpdateBalance' parameters type */
export interface ICdeErc20UpdateBalanceParams {
  balance: string;
  cde_name: string;
  wallet_address: string;
}

/** 'CdeErc20UpdateBalance' return type */
export type ICdeErc20UpdateBalanceResult = void;

/** 'CdeErc20UpdateBalance' query type */
export interface ICdeErc20UpdateBalanceQuery {
  params: ICdeErc20UpdateBalanceParams;
  result: ICdeErc20UpdateBalanceResult;
}

const cdeErc20UpdateBalanceIR: any = {"usedParamSet":{"balance":true,"cde_name":true,"wallet_address":true},"params":[{"name":"balance","required":true,"transform":{"type":"scalar"},"locs":[{"a":40,"b":48}]},{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":67,"b":76}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":99,"b":114}]}],"statement":"UPDATE cde_erc20_data\nSET\n    balance = :balance!\nWHERE cde_name = :cde_name!\nAND wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE cde_erc20_data
 * SET
 *     balance = :balance!
 * WHERE cde_name = :cde_name!
 * AND wallet_address = :wallet_address!
 * ```
 */
export const cdeErc20UpdateBalance = new PreparedQuery<ICdeErc20UpdateBalanceParams,ICdeErc20UpdateBalanceResult>(cdeErc20UpdateBalanceIR);


