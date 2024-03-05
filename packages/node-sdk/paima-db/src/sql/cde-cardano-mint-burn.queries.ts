/** Types generated for queries found in "src/sql/cde-cardano-mint-burn.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'CdeCardanoMintBurnInsert' parameters type */
export interface ICdeCardanoMintBurnInsertParams {
  assets: Json;
  cde_id: number;
  metadata: string;
  tx_id: string;
}

/** 'CdeCardanoMintBurnInsert' return type */
export type ICdeCardanoMintBurnInsertResult = void;

/** 'CdeCardanoMintBurnInsert' query type */
export interface ICdeCardanoMintBurnInsertQuery {
  params: ICdeCardanoMintBurnInsertParams;
  result: ICdeCardanoMintBurnInsertResult;
}

const cdeCardanoMintBurnInsertIR: any = {"usedParamSet":{"cde_id":true,"tx_id":true,"metadata":true,"assets":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":89,"b":96}]},{"name":"tx_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":101,"b":107}]},{"name":"metadata","required":true,"transform":{"type":"scalar"},"locs":[{"a":112,"b":121}]},{"name":"assets","required":true,"transform":{"type":"scalar"},"locs":[{"a":126,"b":133}]}],"statement":"INSERT INTO cde_cardano_mint_burn (\n  cde_id,\n  tx_id,\n  metadata,\n  assets\n) VALUES (\n  :cde_id!,\n  :tx_id!,\n  :metadata!,\n  :assets!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_mint_burn (
 *   cde_id,
 *   tx_id,
 *   metadata,
 *   assets
 * ) VALUES (
 *   :cde_id!,
 *   :tx_id!,
 *   :metadata!,
 *   :assets!
 * )
 * ```
 */
export const cdeCardanoMintBurnInsert = new PreparedQuery<ICdeCardanoMintBurnInsertParams,ICdeCardanoMintBurnInsertResult>(cdeCardanoMintBurnInsertIR);


