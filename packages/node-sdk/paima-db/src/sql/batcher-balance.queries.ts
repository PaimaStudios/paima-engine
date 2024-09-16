/** Types generated for queries found in "src/sql/batcher-balance.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type NumberOrString = number | string;

/** 'BatcherBalanceByAddress' parameters type */
export interface IBatcherBalanceByAddressParams {
  batcher_address: string;
  user_address: string;
}

/** 'BatcherBalanceByAddress' return type */
export interface IBatcherBalanceByAddressResult {
  balance: string;
}

/** 'BatcherBalanceByAddress' query type */
export interface IBatcherBalanceByAddressQuery {
  params: IBatcherBalanceByAddressParams;
  result: IBatcherBalanceByAddressResult;
}

const batcherBalanceByAddressIR: any = {"usedParamSet":{"batcher_address":true,"user_address":true},"params":[{"name":"batcher_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":65,"b":81}]},{"name":"user_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":102,"b":115}]}],"statement":"SELECT balance FROM batcher_balance_data\nWHERE batcher_address = :batcher_address!\nAND user_address = :user_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT balance FROM batcher_balance_data
 * WHERE batcher_address = :batcher_address!
 * AND user_address = :user_address!
 * ```
 */
export const batcherBalanceByAddress = new PreparedQuery<IBatcherBalanceByAddressParams,IBatcherBalanceByAddressResult>(batcherBalanceByAddressIR);


/** 'BatcherBalanceUpdate' parameters type */
export interface IBatcherBalanceUpdateParams {
  balance: NumberOrString;
  batcher_address: string;
  user_address: string;
}

/** 'BatcherBalanceUpdate' return type */
export type IBatcherBalanceUpdateResult = void;

/** 'BatcherBalanceUpdate' query type */
export interface IBatcherBalanceUpdateQuery {
  params: IBatcherBalanceUpdateParams;
  result: IBatcherBalanceUpdateResult;
}

const batcherBalanceUpdateIR: any = {"usedParamSet":{"batcher_address":true,"user_address":true,"balance":true},"params":[{"name":"batcher_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":87,"b":103}]},{"name":"user_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":106,"b":119}]},{"name":"balance","required":true,"transform":{"type":"scalar"},"locs":[{"a":122,"b":130}]}],"statement":"INSERT INTO batcher_balance_data\n  (batcher_address, user_address, balance)\nVALUES \n  (:batcher_address!, :user_address!, :balance!)\nON CONFLICT\n  (batcher_address, user_address)\nDO UPDATE SET \n  balance = batcher_balance_data.balance + EXCLUDED.balance"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO batcher_balance_data
 *   (batcher_address, user_address, balance)
 * VALUES 
 *   (:batcher_address!, :user_address!, :balance!)
 * ON CONFLICT
 *   (batcher_address, user_address)
 * DO UPDATE SET 
 *   balance = batcher_balance_data.balance + EXCLUDED.balance
 * ```
 */
export const batcherBalanceUpdate = new PreparedQuery<IBatcherBalanceUpdateParams,IBatcherBalanceUpdateResult>(batcherBalanceUpdateIR);


