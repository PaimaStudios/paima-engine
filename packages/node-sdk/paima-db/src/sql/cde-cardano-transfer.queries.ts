/** Types generated for queries found in "src/sql/cde-cardano-transfer.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CdeCardanoTransferInsert' parameters type */
export interface ICdeCardanoTransferInsertParams {
  cde_name: string;
  metadata?: string | null | void;
  raw_tx: string;
  tx_id: string;
}

/** 'CdeCardanoTransferInsert' return type */
export type ICdeCardanoTransferInsertResult = void;

/** 'CdeCardanoTransferInsert' query type */
export interface ICdeCardanoTransferInsertQuery {
  params: ICdeCardanoTransferInsertParams;
  result: ICdeCardanoTransferInsertResult;
}

const cdeCardanoTransferInsertIR: any = {"usedParamSet":{"cde_name":true,"tx_id":true,"raw_tx":true,"metadata":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":90,"b":99}]},{"name":"tx_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":104,"b":110}]},{"name":"raw_tx","required":true,"transform":{"type":"scalar"},"locs":[{"a":115,"b":122}]},{"name":"metadata","required":false,"transform":{"type":"scalar"},"locs":[{"a":127,"b":135}]}],"statement":"INSERT INTO cde_cardano_transfer (\n  cde_name,\n  tx_id,\n  raw_tx,\n  metadata\n) VALUES (\n  :cde_name!,\n  :tx_id!,\n  :raw_tx!,\n  :metadata\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_transfer (
 *   cde_name,
 *   tx_id,
 *   raw_tx,
 *   metadata
 * ) VALUES (
 *   :cde_name!,
 *   :tx_id!,
 *   :raw_tx!,
 *   :metadata
 * )
 * ```
 */
export const cdeCardanoTransferInsert = new PreparedQuery<ICdeCardanoTransferInsertParams,ICdeCardanoTransferInsertResult>(cdeCardanoTransferInsertIR);


