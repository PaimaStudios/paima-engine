/** Types generated for queries found in "src/sql/cde-cardano-pool-delegation.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CdeCardanoPoolGetAddressDelegation' parameters type */
export interface ICdeCardanoPoolGetAddressDelegationParams {
  address: string;
}

/** 'CdeCardanoPoolGetAddressDelegation' return type */
export interface ICdeCardanoPoolGetAddressDelegationResult {
  address: string;
  cde_name: string;
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
  cde_name: string;
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

const cdeCardanoPoolInsertDataIR: any = {"usedParamSet":{"cde_name":true,"address":true,"pool":true,"epoch":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":103,"b":112}]},{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":119,"b":127}]},{"name":"pool","required":true,"transform":{"type":"scalar"},"locs":[{"a":134,"b":139},{"a":218,"b":223}]},{"name":"epoch","required":true,"transform":{"type":"scalar"},"locs":[{"a":146,"b":152}]}],"statement":"INSERT INTO cde_cardano_pool_delegation(\n    cde_name,\n    address,\n    pool,\n    epoch\n) VALUES (\n    :cde_name!,\n    :address!,\n    :pool!,\n    :epoch!\n) ON CONFLICT (cde_name, epoch, address) DO\n  UPDATE SET pool = :pool!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_pool_delegation(
 *     cde_name,
 *     address,
 *     pool,
 *     epoch
 * ) VALUES (
 *     :cde_name!,
 *     :address!,
 *     :pool!,
 *     :epoch!
 * ) ON CONFLICT (cde_name, epoch, address) DO
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

const removeOldEntriesIR: any = {"usedParamSet":{"address":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":183,"b":191},{"a":242,"b":250}]}],"statement":"DELETE FROM cde_cardano_pool_delegation\nWHERE (cde_name, epoch, address) NOT IN (\n    SELECT\n        cde_name, epoch, address\n    FROM cde_cardano_pool_delegation\n    WHERE address = :address!\n    ORDER BY epoch DESC\n\tLIMIT 2\n)\nAND address = :address!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM cde_cardano_pool_delegation
 * WHERE (cde_name, epoch, address) NOT IN (
 *     SELECT
 *         cde_name, epoch, address
 *     FROM cde_cardano_pool_delegation
 *     WHERE address = :address!
 *     ORDER BY epoch DESC
 * 	LIMIT 2
 * )
 * AND address = :address!
 * ```
 */
export const removeOldEntries = new PreparedQuery<IRemoveOldEntriesParams,IRemoveOldEntriesResult>(removeOldEntriesIR);


