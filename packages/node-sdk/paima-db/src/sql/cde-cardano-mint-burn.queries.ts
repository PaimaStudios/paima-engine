/** Types generated for queries found in "src/sql/cde-cardano-mint-burn.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'CdeCardanoMintBurnInsert' parameters type */
export interface ICdeCardanoMintBurnInsertParams {
  assets: Json;
  cde_name: string;
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

const cdeCardanoMintBurnInsertIR: any = {"usedParamSet":{"cde_name":true,"tx_id":true,"metadata":true,"assets":true,"input_addresses":true,"output_addresses":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":130,"b":139}]},{"name":"tx_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":144,"b":150}]},{"name":"metadata","required":true,"transform":{"type":"scalar"},"locs":[{"a":155,"b":164}]},{"name":"assets","required":true,"transform":{"type":"scalar"},"locs":[{"a":169,"b":176}]},{"name":"input_addresses","required":true,"transform":{"type":"scalar"},"locs":[{"a":181,"b":197}]},{"name":"output_addresses","required":true,"transform":{"type":"scalar"},"locs":[{"a":202,"b":219}]}],"statement":"INSERT INTO cde_cardano_mint_burn (\n  cde_name,\n  tx_id,\n  metadata,\n  assets,\n  input_addresses,\n  output_addresses\n) VALUES (\n  :cde_name!,\n  :tx_id!,\n  :metadata!,\n  :assets!,\n  :input_addresses!,\n  :output_addresses!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_mint_burn (
 *   cde_name,
 *   tx_id,
 *   metadata,
 *   assets,
 *   input_addresses,
 *   output_addresses
 * ) VALUES (
 *   :cde_name!,
 *   :tx_id!,
 *   :metadata!,
 *   :assets!,
 *   :input_addresses!,
 *   :output_addresses!
 * )
 * ```
 */
export const cdeCardanoMintBurnInsert = new PreparedQuery<ICdeCardanoMintBurnInsertParams,ICdeCardanoMintBurnInsertResult>(cdeCardanoMintBurnInsertIR);


