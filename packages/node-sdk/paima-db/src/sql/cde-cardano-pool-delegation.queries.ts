/** Types generated for queries found in "src/sql/cde-cardano-pool-delegation.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CdeCardanoPoolGetAddressDelegation' parameters type */
export interface ICdeCardanoPoolGetAddressDelegationParams {
  address: string;
}

/** 'CdeCardanoPoolGetAddressDelegation' return type */
export interface ICdeCardanoPoolGetAddressDelegationResult {
  address: string;
  cde_id: number;
  pool: string | null;
}

/** 'CdeCardanoPoolGetAddressDelegation' query type */
export interface ICdeCardanoPoolGetAddressDelegationQuery {
  params: ICdeCardanoPoolGetAddressDelegationParams;
  result: ICdeCardanoPoolGetAddressDelegationResult;
}

const cdeCardanoPoolGetAddressDelegationIR: any = {"usedParamSet":{"address":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":59,"b":67}]}],"statement":"SELECT * FROM cde_cardano_pool_delegation \nWHERE address = :address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_cardano_pool_delegation 
 * WHERE address = :address!
 * ```
 */
export const cdeCardanoPoolGetAddressDelegation = new PreparedQuery<ICdeCardanoPoolGetAddressDelegationParams,ICdeCardanoPoolGetAddressDelegationResult>(cdeCardanoPoolGetAddressDelegationIR);


/** 'CdeCardanoPoolInsertData' parameters type */
export interface ICdeCardanoPoolInsertDataParams {
  address: string;
  cde_id: number;
  pool: string;
}

/** 'CdeCardanoPoolInsertData' return type */
export type ICdeCardanoPoolInsertDataResult = void;

/** 'CdeCardanoPoolInsertData' query type */
export interface ICdeCardanoPoolInsertDataQuery {
  params: ICdeCardanoPoolInsertDataParams;
  result: ICdeCardanoPoolInsertDataResult;
}

const cdeCardanoPoolInsertDataIR: any = {"usedParamSet":{"cde_id":true,"address":true,"pool":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":90,"b":97}]},{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":104,"b":112}]},{"name":"pool","required":true,"transform":{"type":"scalar"},"locs":[{"a":119,"b":124},{"a":181,"b":186}]}],"statement":"INSERT INTO cde_cardano_pool_delegation(\n    cde_id,\n    address,\n    pool\n) VALUES (\n    :cde_id!,\n    :address!,\n    :pool!\n) ON CONFLICT (cde_id, address) DO\n  UPDATE SET pool = :pool!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_pool_delegation(
 *     cde_id,
 *     address,
 *     pool
 * ) VALUES (
 *     :cde_id!,
 *     :address!,
 *     :pool!
 * ) ON CONFLICT (cde_id, address) DO
 *   UPDATE SET pool = :pool!
 * ```
 */
export const cdeCardanoPoolInsertData = new PreparedQuery<ICdeCardanoPoolInsertDataParams,ICdeCardanoPoolInsertDataResult>(cdeCardanoPoolInsertDataIR);


