/** Types generated for queries found in "src/sql/cde-batcher-payment.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type NumberOrString = number | string;

/** 'CdeBatcherPaymentByAddress' parameters type */
export interface ICdeBatcherPaymentByAddressParams {
  batcher_address: string;
  cde_name: string;
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

const cdeBatcherPaymentByAddressIR: any = {"usedParamSet":{"cde_name":true,"batcher_address":true,"user_address":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":62,"b":71}]},{"name":"batcher_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":95,"b":111}]},{"name":"user_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":132,"b":145}]}],"statement":"SELECT balance FROM cde_batcher_payment_data\nWHERE cde_name = :cde_name!\nAND batcher_address = :batcher_address!\nAND user_address = :user_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT balance FROM cde_batcher_payment_data
 * WHERE cde_name = :cde_name!
 * AND batcher_address = :batcher_address!
 * AND user_address = :user_address!
 * ```
 */
export const cdeBatcherPaymentByAddress = new PreparedQuery<ICdeBatcherPaymentByAddressParams,ICdeBatcherPaymentByAddressResult>(cdeBatcherPaymentByAddressIR);


/** 'CdeBatcherPaymentUpdateBalance' parameters type */
export interface ICdeBatcherPaymentUpdateBalanceParams {
  balance: NumberOrString;
  batcher_address: string;
  cde_name: string;
  user_address: string;
}

/** 'CdeBatcherPaymentUpdateBalance' return type */
export type ICdeBatcherPaymentUpdateBalanceResult = void;

/** 'CdeBatcherPaymentUpdateBalance' query type */
export interface ICdeBatcherPaymentUpdateBalanceQuery {
  params: ICdeBatcherPaymentUpdateBalanceParams;
  result: ICdeBatcherPaymentUpdateBalanceResult;
}

const cdeBatcherPaymentUpdateBalanceIR: any = {"usedParamSet":{"cde_name":true,"batcher_address":true,"user_address":true,"balance":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":101,"b":110}]},{"name":"batcher_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":113,"b":129}]},{"name":"user_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":132,"b":145}]},{"name":"balance","required":true,"transform":{"type":"scalar"},"locs":[{"a":148,"b":156}]}],"statement":"INSERT INTO cde_batcher_payment_data\n  (cde_name, batcher_address, user_address, balance)\nVALUES \n  (:cde_name!, :batcher_address!, :user_address!, :balance!)\nON CONFLICT\n  (cde_name, batcher_address, user_address)\nDO UPDATE SET \n  balance = cde_batcher_payment_data.balance + EXCLUDED.balance"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_batcher_payment_data
 *   (cde_name, batcher_address, user_address, balance)
 * VALUES 
 *   (:cde_name!, :batcher_address!, :user_address!, :balance!)
 * ON CONFLICT
 *   (cde_name, batcher_address, user_address)
 * DO UPDATE SET 
 *   balance = cde_batcher_payment_data.balance + EXCLUDED.balance
 * ```
 */
export const cdeBatcherPaymentUpdateBalance = new PreparedQuery<ICdeBatcherPaymentUpdateBalanceParams,ICdeBatcherPaymentUpdateBalanceResult>(cdeBatcherPaymentUpdateBalanceIR);


