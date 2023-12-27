/** Types generated for queries found in "src/sql/cde-cardano-asset-utxos.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type NumberOrString = number | string;

/** 'CdeCardanoAssetUtxosByAddress' parameters type */
export interface ICdeCardanoAssetUtxosByAddressParams {
  address: string;
  cip14_fingerprint: string;
}

/** 'CdeCardanoAssetUtxosByAddress' return type */
export interface ICdeCardanoAssetUtxosByAddressResult {
  address: string;
  amount: string;
  cde_id: number;
  cip14_fingerprint: string;
  output_index: number;
  tx_id: string;
}

/** 'CdeCardanoAssetUtxosByAddress' query type */
export interface ICdeCardanoAssetUtxosByAddressQuery {
  params: ICdeCardanoAssetUtxosByAddressParams;
  result: ICdeCardanoAssetUtxosByAddressResult;
}

const cdeCardanoAssetUtxosByAddressIR: any = {"usedParamSet":{"address":true,"cip14_fingerprint":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":58,"b":66}]},{"name":"cip14_fingerprint","required":true,"transform":{"type":"scalar"},"locs":[{"a":92,"b":110}]}],"statement":"SELECT * FROM cde_cardano_asset_utxos \nWHERE \n  address = :address! AND cip14_fingerprint = :cip14_fingerprint!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_cardano_asset_utxos 
 * WHERE 
 *   address = :address! AND cip14_fingerprint = :cip14_fingerprint!
 * ```
 */
export const cdeCardanoAssetUtxosByAddress = new PreparedQuery<ICdeCardanoAssetUtxosByAddressParams,ICdeCardanoAssetUtxosByAddressResult>(cdeCardanoAssetUtxosByAddressIR);


/** 'CdeInsertCardanoAssetUtxo' parameters type */
export interface ICdeInsertCardanoAssetUtxoParams {
  address: string;
  amount: NumberOrString;
  cde_id: number;
  cip14_fingerprint: string;
  output_index: number;
  tx_id: string;
}

/** 'CdeInsertCardanoAssetUtxo' return type */
export type ICdeInsertCardanoAssetUtxoResult = void;

/** 'CdeInsertCardanoAssetUtxo' query type */
export interface ICdeInsertCardanoAssetUtxoQuery {
  params: ICdeInsertCardanoAssetUtxoParams;
  result: ICdeInsertCardanoAssetUtxoResult;
}

const cdeInsertCardanoAssetUtxoIR: any = {"usedParamSet":{"cde_id":true,"address":true,"tx_id":true,"output_index":true,"amount":true,"cip14_fingerprint":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":141,"b":148}]},{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":155,"b":163}]},{"name":"tx_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":170,"b":176}]},{"name":"output_index","required":true,"transform":{"type":"scalar"},"locs":[{"a":183,"b":196}]},{"name":"amount","required":true,"transform":{"type":"scalar"},"locs":[{"a":203,"b":210}]},{"name":"cip14_fingerprint","required":true,"transform":{"type":"scalar"},"locs":[{"a":217,"b":235}]}],"statement":"INSERT INTO cde_cardano_asset_utxos(\n    cde_id,\n    address,\n    tx_id,\n    output_index, \n    amount,\n    cip14_fingerprint\n) VALUES (\n    :cde_id!,\n    :address!,\n    :tx_id!,\n    :output_index!,\n    :amount!,\n    :cip14_fingerprint!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_asset_utxos(
 *     cde_id,
 *     address,
 *     tx_id,
 *     output_index, 
 *     amount,
 *     cip14_fingerprint
 * ) VALUES (
 *     :cde_id!,
 *     :address!,
 *     :tx_id!,
 *     :output_index!,
 *     :amount!,
 *     :cip14_fingerprint!
 * )
 * ```
 */
export const cdeInsertCardanoAssetUtxo = new PreparedQuery<ICdeInsertCardanoAssetUtxoParams,ICdeInsertCardanoAssetUtxoResult>(cdeInsertCardanoAssetUtxoIR);


/** 'CdeSpendCardanoAssetUtxo' parameters type */
export interface ICdeSpendCardanoAssetUtxoParams {
  output_index: number;
  tx_id: string;
}

/** 'CdeSpendCardanoAssetUtxo' return type */
export type ICdeSpendCardanoAssetUtxoResult = void;

/** 'CdeSpendCardanoAssetUtxo' query type */
export interface ICdeSpendCardanoAssetUtxoQuery {
  params: ICdeSpendCardanoAssetUtxoParams;
  result: ICdeSpendCardanoAssetUtxoResult;
}

const cdeSpendCardanoAssetUtxoIR: any = {"usedParamSet":{"tx_id":true,"output_index":true},"params":[{"name":"tx_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":50,"b":56}]},{"name":"output_index","required":true,"transform":{"type":"scalar"},"locs":[{"a":77,"b":90}]}],"statement":"DELETE FROM cde_cardano_asset_utxos\nWHERE tx_id = :tx_id! AND output_index = :output_index!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM cde_cardano_asset_utxos
 * WHERE tx_id = :tx_id! AND output_index = :output_index!
 * ```
 */
export const cdeSpendCardanoAssetUtxo = new PreparedQuery<ICdeSpendCardanoAssetUtxoParams,ICdeSpendCardanoAssetUtxoResult>(cdeSpendCardanoAssetUtxoIR);


