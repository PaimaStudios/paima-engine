/** Types generated for queries found in "src/sql/cde-cardano-transfer.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CdeCardanoTransferInsert' parameters type */
export interface ICdeCardanoTransferInsertParams {
  cde_id: number;
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

const cdeCardanoTransferInsertIR: any = {"usedParamSet":{"cde_id":true,"tx_id":true,"raw_tx":true,"metadata":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":88,"b":95}]},{"name":"tx_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":100,"b":106}]},{"name":"raw_tx","required":true,"transform":{"type":"scalar"},"locs":[{"a":111,"b":118}]},{"name":"metadata","required":false,"transform":{"type":"scalar"},"locs":[{"a":123,"b":131}]}],"statement":"INSERT INTO cde_cardano_transfer (\n  cde_id,\n  tx_id,\n  raw_tx,\n  metadata\n) VALUES (\n  :cde_id!,\n  :tx_id!,\n  :raw_tx!,\n  :metadata\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_transfer (
 *   cde_id,
 *   tx_id,
 *   raw_tx,
 *   metadata
 * ) VALUES (
 *   :cde_id!,
 *   :tx_id!,
 *   :raw_tx!,
 *   :metadata
 * )
 * ```
 */
export const cdeCardanoTransferInsert = new PreparedQuery<ICdeCardanoTransferInsertParams,ICdeCardanoTransferInsertResult>(cdeCardanoTransferInsertIR);


