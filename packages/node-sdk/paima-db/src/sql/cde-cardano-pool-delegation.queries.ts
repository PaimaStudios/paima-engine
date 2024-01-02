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
  epoch: number;
  pool: string | null;
}

/** 'CdeCardanoPoolGetAddressDelegation' query type */
export interface ICdeCardanoPoolGetAddressDelegationQuery {
  params: ICdeCardanoPoolGetAddressDelegationParams;
  result: ICdeCardanoPoolGetAddressDelegationResult;
}

const cdeCardanoPoolGetAddressDelegationIR: any = {"usedParamSet":{"address":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":59,"b":67}]}],"statement":"SELECT * FROM cde_cardano_pool_delegation \nWHERE address = :address!\nORDER BY epoch"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_cardano_pool_delegation 
 * WHERE address = :address!
 * ORDER BY epoch
 * ```
 */
export const cdeCardanoPoolGetAddressDelegation = new PreparedQuery<ICdeCardanoPoolGetAddressDelegationParams,ICdeCardanoPoolGetAddressDelegationResult>(cdeCardanoPoolGetAddressDelegationIR);


/** 'CdeCardanoPoolInsertData' parameters type */
export interface ICdeCardanoPoolInsertDataParams {
  address: string;
  cde_id: number;
  epoch: number;
  pool: string;
}

/** 'CdeCardanoPoolInsertData' return type */
export type ICdeCardanoPoolInsertDataResult = void;

/** 'CdeCardanoPoolInsertData' query type */
export interface ICdeCardanoPoolInsertDataQuery {
  params: ICdeCardanoPoolInsertDataParams;
  result: ICdeCardanoPoolInsertDataResult;
}

const cdeCardanoPoolInsertDataIR: any = {"usedParamSet":{"cde_id":true,"address":true,"pool":true,"epoch":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":101,"b":108}]},{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":115,"b":123}]},{"name":"pool","required":true,"transform":{"type":"scalar"},"locs":[{"a":130,"b":135},{"a":212,"b":217}]},{"name":"epoch","required":true,"transform":{"type":"scalar"},"locs":[{"a":142,"b":148}]}],"statement":"INSERT INTO cde_cardano_pool_delegation(\n    cde_id,\n    address,\n    pool,\n    epoch\n) VALUES (\n    :cde_id!,\n    :address!,\n    :pool!,\n    :epoch!\n) ON CONFLICT (cde_id, epoch, address) DO\n  UPDATE SET pool = :pool!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_pool_delegation(
 *     cde_id,
 *     address,
 *     pool,
 *     epoch
 * ) VALUES (
 *     :cde_id!,
 *     :address!,
 *     :pool!,
 *     :epoch!
 * ) ON CONFLICT (cde_id, epoch, address) DO
 *   UPDATE SET pool = :pool!
 * ```
 */
export const cdeCardanoPoolInsertData = new PreparedQuery<ICdeCardanoPoolInsertDataParams,ICdeCardanoPoolInsertDataResult>(cdeCardanoPoolInsertDataIR);


/** 'RemoveOldEntries' parameters type */
export interface IRemoveOldEntriesParams {
  address: string;
}

/** 'RemoveOldEntries' return type */
export type IRemoveOldEntriesResult = void;

/** 'RemoveOldEntries' query type */
export interface IRemoveOldEntriesQuery {
  params: IRemoveOldEntriesParams;
  result: IRemoveOldEntriesResult;
}

const removeOldEntriesIR: any = {"usedParamSet":{"address":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":179,"b":187},{"a":238,"b":246}]}],"statement":"DELETE FROM cde_cardano_pool_delegation\nWHERE (cde_id, epoch, address) NOT IN (\n    SELECT\n        cde_id, epoch, address\n    FROM cde_cardano_pool_delegation\n    WHERE address = :address!\n    ORDER BY epoch DESC\n\tLIMIT 2\n)\nAND address = :address!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM cde_cardano_pool_delegation
 * WHERE (cde_id, epoch, address) NOT IN (
 *     SELECT
 *         cde_id, epoch, address
 *     FROM cde_cardano_pool_delegation
 *     WHERE address = :address!
 *     ORDER BY epoch DESC
 * 	LIMIT 2
 * )
 * AND address = :address!
 * ```
 */
export const removeOldEntries = new PreparedQuery<IRemoveOldEntriesParams,IRemoveOldEntriesResult>(removeOldEntriesIR);


