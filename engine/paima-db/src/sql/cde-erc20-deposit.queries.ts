/** Types generated for queries found in "src/sql/cde-erc20-deposit.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'CdeErc20DepositGetTotalDeposited' parameters type */
export interface ICdeErc20DepositGetTotalDepositedParams {
  cde_id: number;
  wallet_address: string;
}

/** 'CdeErc20DepositGetTotalDeposited' return type */
export interface ICdeErc20DepositGetTotalDepositedResult {
  cde_id: number;
  total_deposited: string;
  wallet_address: string;
}

/** 'CdeErc20DepositGetTotalDeposited' query type */
export interface ICdeErc20DepositGetTotalDepositedQuery {
  params: ICdeErc20DepositGetTotalDepositedParams;
  result: ICdeErc20DepositGetTotalDepositedResult;
}

const cdeErc20DepositGetTotalDepositedIR: any = {"usedParamSet":{"cde_id":true,"wallet_address":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":52,"b":59}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":82,"b":97}]}],"statement":"SELECT * FROM cde_erc20_deposit_data\nWHERE cde_id = :cde_id!\nAND wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc20_deposit_data
 * WHERE cde_id = :cde_id!
 * AND wallet_address = :wallet_address!
 * ```
 */
export const cdeErc20DepositGetTotalDeposited = new PreparedQuery<ICdeErc20DepositGetTotalDepositedParams,ICdeErc20DepositGetTotalDepositedResult>(cdeErc20DepositGetTotalDepositedIR);


/** 'CdeErc20DepositInsertTotalDeposited' parameters type */
export interface ICdeErc20DepositInsertTotalDepositedParams {
  cde_id: number;
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

const cdeErc20DepositInsertTotalDepositedIR: any = {"usedParamSet":{"cde_id":true,"wallet_address":true,"total_deposited":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":103,"b":110}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":117,"b":132}]},{"name":"total_deposited","required":true,"transform":{"type":"scalar"},"locs":[{"a":139,"b":155}]}],"statement":"INSERT INTO cde_erc20_deposit_data(\n    cde_id,\n    wallet_address,\n    total_deposited\n) VALUES (\n    :cde_id!,\n    :wallet_address!,\n    :total_deposited!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_erc20_deposit_data(
 *     cde_id,
 *     wallet_address,
 *     total_deposited
 * ) VALUES (
 *     :cde_id!,
 *     :wallet_address!,
 *     :total_deposited!
 * )
 * ```
 */
export const cdeErc20DepositInsertTotalDeposited = new PreparedQuery<ICdeErc20DepositInsertTotalDepositedParams,ICdeErc20DepositInsertTotalDepositedResult>(cdeErc20DepositInsertTotalDepositedIR);


/** 'CdeErc20DepositUpdateTotalDeposited' parameters type */
export interface ICdeErc20DepositUpdateTotalDepositedParams {
  cde_id: number;
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

const cdeErc20DepositUpdateTotalDepositedIR: any = {"usedParamSet":{"total_deposited":true,"cde_id":true,"wallet_address":true},"params":[{"name":"total_deposited","required":true,"transform":{"type":"scalar"},"locs":[{"a":56,"b":72}]},{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":89,"b":96}]},{"name":"wallet_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":119,"b":134}]}],"statement":"UPDATE cde_erc20_deposit_data\nSET\n    total_deposited = :total_deposited!\nWHERE cde_id = :cde_id!\nAND wallet_address = :wallet_address!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE cde_erc20_deposit_data
 * SET
 *     total_deposited = :total_deposited!
 * WHERE cde_id = :cde_id!
 * AND wallet_address = :wallet_address!
 * ```
 */
export const cdeErc20DepositUpdateTotalDeposited = new PreparedQuery<ICdeErc20DepositUpdateTotalDepositedParams,ICdeErc20DepositUpdateTotalDepositedResult>(cdeErc20DepositUpdateTotalDepositedIR);


/** 'CdeErc20DepositSelectAll' parameters type */
export interface ICdeErc20DepositSelectAllParams {
  cde_id: number;
}

/** 'CdeErc20DepositSelectAll' return type */
export interface ICdeErc20DepositSelectAllResult {
  cde_id: number;
  total_deposited: string;
  wallet_address: string;
}

/** 'CdeErc20DepositSelectAll' query type */
export interface ICdeErc20DepositSelectAllQuery {
  params: ICdeErc20DepositSelectAllParams;
  result: ICdeErc20DepositSelectAllResult;
}

const cdeErc20DepositSelectAllIR: any = {"usedParamSet":{"cde_id":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":52,"b":59}]}],"statement":"SELECT * FROM cde_erc20_deposit_data\nWHERE cde_id = :cde_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc20_deposit_data
 * WHERE cde_id = :cde_id!
 * ```
 */
export const cdeErc20DepositSelectAll = new PreparedQuery<ICdeErc20DepositSelectAllParams,ICdeErc20DepositSelectAllResult>(cdeErc20DepositSelectAllIR);


