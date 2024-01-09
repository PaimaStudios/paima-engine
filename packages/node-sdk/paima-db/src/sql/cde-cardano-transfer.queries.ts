/** Types generated for queries found in "src/sql/cde-cardano-transfer.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CdeCardanoTransferInsert' parameters type */
export interface ICdeCardanoTransferInsertParams {
  cde_id: number;
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

const cdeCardanoTransferInsertIR: any = {"usedParamSet":{"cde_id":true,"tx_id":true,"raw_tx":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":76,"b":83}]},{"name":"tx_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":88,"b":94}]},{"name":"raw_tx","required":true,"transform":{"type":"scalar"},"locs":[{"a":99,"b":106}]}],"statement":"INSERT INTO cde_cardano_transfer (\n  cde_id,\n  tx_id,\n  raw_tx\n) VALUES (\n  :cde_id!,\n  :tx_id!,\n  :raw_tx!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_transfer (
 *   cde_id,
 *   tx_id,
 *   raw_tx
 * ) VALUES (
 *   :cde_id!,
 *   :tx_id!,
 *   :raw_tx!
 * )
 * ```
 */
export const cdeCardanoTransferInsert = new PreparedQuery<ICdeCardanoTransferInsertParams,ICdeCardanoTransferInsertResult>(cdeCardanoTransferInsertIR);


