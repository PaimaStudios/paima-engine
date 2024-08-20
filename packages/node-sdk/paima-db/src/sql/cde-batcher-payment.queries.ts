/** Types generated for queries found in "src/sql/cde-batcher-payment.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type NumberOrString = number | string;

/** 'CdeBatcherPaymentByAddress' parameters type */
export interface ICdeBatcherPaymentByAddressParams {
  batcher_address: string;
  user_address: string;
}

/** 'CdeBatcherPaymentByAddress' return type */
export interface ICdeBatcherPaymentByAddressResult {
  balance: string;
}

/** 'CdeBatcherPaymentByAddress' query type */
export interface ICdeBatcherPaymentByAddressQuery {
  params: ICdeBatcherPaymentByAddressParams;
  result: ICdeBatcherPaymentByAddressResult;
}

const cdeBatcherPaymentByAddressIR: any = {"usedParamSet":{"batcher_address":true,"user_address":true},"params":[{"name":"batcher_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":69,"b":85}]},{"name":"user_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":106,"b":119}]}],"statement":"SELECT balance FROM cde_batcher_payment_data\nWHERE batcher_address = :batcher_address!\nAND user_address = :user_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT balance FROM cde_batcher_payment_data
 * WHERE batcher_address = :batcher_address!
 * AND user_address = :user_address!
 * ```
 */
export const cdeBatcherPaymentByAddress = new PreparedQuery<ICdeBatcherPaymentByAddressParams,ICdeBatcherPaymentByAddressResult>(cdeBatcherPaymentByAddressIR);


/** 'CdeBatcherPaymentUpdateBalance' parameters type */
export interface ICdeBatcherPaymentUpdateBalanceParams {
  balance: NumberOrString;
  batcher_address: string;
  user_address: string;
}

/** 'CdeBatcherPaymentUpdateBalance' return type */
export type ICdeBatcherPaymentUpdateBalanceResult = void;

/** 'CdeBatcherPaymentUpdateBalance' query type */
export interface ICdeBatcherPaymentUpdateBalanceQuery {
  params: ICdeBatcherPaymentUpdateBalanceParams;
  result: ICdeBatcherPaymentUpdateBalanceResult;
}

const cdeBatcherPaymentUpdateBalanceIR: any = {"usedParamSet":{"batcher_address":true,"user_address":true,"balance":true},"params":[{"name":"batcher_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":91,"b":107}]},{"name":"user_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":110,"b":123}]},{"name":"balance","required":true,"transform":{"type":"scalar"},"locs":[{"a":126,"b":134}]}],"statement":"INSERT INTO cde_batcher_payment_data\n  (batcher_address, user_address, balance)\nVALUES \n  (:batcher_address!, :user_address!, :balance!)\nON CONFLICT\n  (batcher_address, user_address)\nDO UPDATE SET \n  balance = cde_batcher_payment_data.balance + EXCLUDED.balance"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_batcher_payment_data
 *   (batcher_address, user_address, balance)
 * VALUES 
 *   (:batcher_address!, :user_address!, :balance!)
 * ON CONFLICT
 *   (batcher_address, user_address)
 * DO UPDATE SET 
 *   balance = cde_batcher_payment_data.balance + EXCLUDED.balance
 * ```
 */
export const cdeBatcherPaymentUpdateBalance = new PreparedQuery<ICdeBatcherPaymentUpdateBalanceParams,ICdeBatcherPaymentUpdateBalanceResult>(cdeBatcherPaymentUpdateBalanceIR);


