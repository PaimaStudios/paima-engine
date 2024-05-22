/** Types generated for queries found in "src/sql/cde-erc20-deposit.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CdeErc20DepositGetTotalDeposited' parameters type */
export interface ICdeErc20DepositGetTotalDepositedParams {
  cde_name: string;
  wallet_address: string;
}

/** 'CdeErc20DepositGetTotalDeposited' return type */
export interface ICdeErc20DepositGetTotalDepositedResult {
  cde_name: string;
  total_deposited: string;
  wallet_address: string;
}

/** 'CdeErc20DepositGetTotalDeposited' query type */
export interface ICdeErc20DepositGetTotalDepositedQuery {
  params: ICdeErc20DepositGetTotalDepositedParams;
  result: ICdeErc20DepositGetTotalDepositedResult;
}

const cdeErc20DepositGetTotalDepositedIR: any = {"usedParamSet":{"cde_name":true,"wallet_address":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":54,"b":63}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":86,"b":101}]}],"statement":"SELECT * FROM cde_erc20_deposit_data\nWHERE cde_name = :cde_name!\nAND wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc20_deposit_data
 * WHERE cde_name = :cde_name!
 * AND wallet_address = :wallet_address!
 * ```
 */
export const cdeErc20DepositGetTotalDeposited = new PreparedQuery<ICdeErc20DepositGetTotalDepositedParams,ICdeErc20DepositGetTotalDepositedResult>(cdeErc20DepositGetTotalDepositedIR);


/** 'CdeErc20DepositInsertTotalDeposited' parameters type */
export interface ICdeErc20DepositInsertTotalDepositedParams {
  cde_name: string;
  total_deposited: string;
  wallet_address: string;
}

/** 'CdeErc20DepositInsertTotalDeposited' return type */
export type ICdeErc20DepositInsertTotalDepositedResult = void;

/** 'CdeErc20DepositInsertTotalDeposited' query type */
export interface ICdeErc20DepositInsertTotalDepositedQuery {
  params: ICdeErc20DepositInsertTotalDepositedParams;
  result: ICdeErc20DepositInsertTotalDepositedResult;
}

const cdeErc20DepositInsertTotalDepositedIR: any = {"usedParamSet":{"cde_name":true,"wallet_address":true,"total_deposited":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":105,"b":114}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":121,"b":136}]},{"name":"total_deposited","required":true,"transform":{"type":"scalar"},"locs":[{"a":143,"b":159}]}],"statement":"INSERT INTO cde_erc20_deposit_data(\n    cde_name,\n    wallet_address,\n    total_deposited\n) VALUES (\n    :cde_name!,\n    :wallet_address!,\n    :total_deposited!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_erc20_deposit_data(
 *     cde_name,
 *     wallet_address,
 *     total_deposited
 * ) VALUES (
 *     :cde_name!,
 *     :wallet_address!,
 *     :total_deposited!
 * )
 * ```
 */
export const cdeErc20DepositInsertTotalDeposited = new PreparedQuery<ICdeErc20DepositInsertTotalDepositedParams,ICdeErc20DepositInsertTotalDepositedResult>(cdeErc20DepositInsertTotalDepositedIR);


/** 'CdeErc20DepositUpdateTotalDeposited' parameters type */
export interface ICdeErc20DepositUpdateTotalDepositedParams {
  cde_name: string;
  total_deposited: string;
  wallet_address: string;
}

/** 'CdeErc20DepositUpdateTotalDeposited' return type */
export type ICdeErc20DepositUpdateTotalDepositedResult = void;

/** 'CdeErc20DepositUpdateTotalDeposited' query type */
export interface ICdeErc20DepositUpdateTotalDepositedQuery {
  params: ICdeErc20DepositUpdateTotalDepositedParams;
  result: ICdeErc20DepositUpdateTotalDepositedResult;
}

const cdeErc20DepositUpdateTotalDepositedIR: any = {"usedParamSet":{"total_deposited":true,"cde_name":true,"wallet_address":true},"params":[{"name":"total_deposited","required":true,"transform":{"type":"scalar"},"locs":[{"a":56,"b":72}]},{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":91,"b":100}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":123,"b":138}]}],"statement":"UPDATE cde_erc20_deposit_data\nSET\n    total_deposited = :total_deposited!\nWHERE cde_name = :cde_name!\nAND wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE cde_erc20_deposit_data
 * SET
 *     total_deposited = :total_deposited!
 * WHERE cde_name = :cde_name!
 * AND wallet_address = :wallet_address!
 * ```
 */
export const cdeErc20DepositUpdateTotalDeposited = new PreparedQuery<ICdeErc20DepositUpdateTotalDepositedParams,ICdeErc20DepositUpdateTotalDepositedResult>(cdeErc20DepositUpdateTotalDepositedIR);


/** 'CdeErc20DepositSelectAll' parameters type */
export interface ICdeErc20DepositSelectAllParams {
  cde_name: string;
}

/** 'CdeErc20DepositSelectAll' return type */
export interface ICdeErc20DepositSelectAllResult {
  cde_name: string;
  total_deposited: string;
  wallet_address: string;
}

/** 'CdeErc20DepositSelectAll' query type */
export interface ICdeErc20DepositSelectAllQuery {
  params: ICdeErc20DepositSelectAllParams;
  result: ICdeErc20DepositSelectAllResult;
}

const cdeErc20DepositSelectAllIR: any = {"usedParamSet":{"cde_name":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":54,"b":63}]}],"statement":"SELECT * FROM cde_erc20_deposit_data\nWHERE cde_name = :cde_name!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc20_deposit_data
 * WHERE cde_name = :cde_name!
 * ```
 */
export const cdeErc20DepositSelectAll = new PreparedQuery<ICdeErc20DepositSelectAllParams,ICdeErc20DepositSelectAllResult>(cdeErc20DepositSelectAllIR);


