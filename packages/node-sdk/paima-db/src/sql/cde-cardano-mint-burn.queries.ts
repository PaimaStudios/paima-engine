/** Types generated for queries found in "src/sql/cde-cardano-mint-burn.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'CdeCardanoMintBurnInsert' parameters type */
export interface ICdeCardanoMintBurnInsertParams {
  assets: Json;
  cde_id: number;
  input_addresses: Json;
  metadata: string;
  output_addresses: Json;
  tx_id: string;
}

/** 'CdeCardanoMintBurnInsert' return type */
export type ICdeCardanoMintBurnInsertResult = void;

/** 'CdeCardanoMintBurnInsert' query type */
export interface ICdeCardanoMintBurnInsertQuery {
  params: ICdeCardanoMintBurnInsertParams;
  result: ICdeCardanoMintBurnInsertResult;
}

const cdeCardanoMintBurnInsertIR: any = {"usedParamSet":{"cde_id":true,"tx_id":true,"metadata":true,"assets":true,"input_addresses":true,"output_addresses":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":128,"b":135}]},{"name":"tx_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":140,"b":146}]},{"name":"metadata","required":true,"transform":{"type":"scalar"},"locs":[{"a":151,"b":160}]},{"name":"assets","required":true,"transform":{"type":"scalar"},"locs":[{"a":165,"b":172}]},{"name":"input_addresses","required":true,"transform":{"type":"scalar"},"locs":[{"a":177,"b":193}]},{"name":"output_addresses","required":true,"transform":{"type":"scalar"},"locs":[{"a":198,"b":215}]}],"statement":"INSERT INTO cde_cardano_mint_burn (\n  cde_id,\n  tx_id,\n  metadata,\n  assets,\n  input_addresses,\n  output_addresses\n) VALUES (\n  :cde_id!,\n  :tx_id!,\n  :metadata!,\n  :assets!,\n  :input_addresses!,\n  :output_addresses!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_mint_burn (
 *   cde_id,
 *   tx_id,
 *   metadata,
 *   assets,
 *   input_addresses,
 *   output_addresses
 * ) VALUES (
 *   :cde_id!,
 *   :tx_id!,
 *   :metadata!,
 *   :assets!,
 *   :input_addresses!,
 *   :output_addresses!
 * )
 * ```
 */
export const cdeCardanoMintBurnInsert = new PreparedQuery<ICdeCardanoMintBurnInsertParams,ICdeCardanoMintBurnInsertResult>(cdeCardanoMintBurnInsertIR);


