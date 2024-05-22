/** Types generated for queries found in "src/sql/cde-cardano-asset-utxos.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type NumberOrString = number | string;

/** 'CdeCardanoAssetUtxosByAddress' parameters type */
export interface ICdeCardanoAssetUtxosByAddressParams {
  address: string;
  cip14_fingerprint?: string | null | void;
  policy_id?: string | null | void;
}

/** 'CdeCardanoAssetUtxosByAddress' return type */
export interface ICdeCardanoAssetUtxosByAddressResult {
  address: string;
  amount: string;
  asset_name: string;
  cde_name: string;
  cip14_fingerprint: string;
  output_index: number;
  policy_id: string;
  tx_id: string;
}

/** 'CdeCardanoAssetUtxosByAddress' query type */
export interface ICdeCardanoAssetUtxosByAddressQuery {
  params: ICdeCardanoAssetUtxosByAddressParams;
  result: ICdeCardanoAssetUtxosByAddressResult;
}

const cdeCardanoAssetUtxosByAddressIR: any = {"usedParamSet":{"address":true,"cip14_fingerprint":true,"policy_id":true},"params":[{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":58,"b":66}]},{"name":"cip14_fingerprint","required":false,"transform":{"type":"scalar"},"locs":[{"a":103,"b":120}]},{"name":"policy_id","required":false,"transform":{"type":"scalar"},"locs":[{"a":135,"b":144}]}],"statement":"SELECT * FROM cde_cardano_asset_utxos \nWHERE \n  address = :address! AND\n  COALESCE(cip14_fingerprint = :cip14_fingerprint, policy_id = :policy_id, false)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_cardano_asset_utxos 
 * WHERE 
 *   address = :address! AND
 *   COALESCE(cip14_fingerprint = :cip14_fingerprint, policy_id = :policy_id, false)
 * ```
 */
export const cdeCardanoAssetUtxosByAddress = new PreparedQuery<ICdeCardanoAssetUtxosByAddressParams,ICdeCardanoAssetUtxosByAddressResult>(cdeCardanoAssetUtxosByAddressIR);


/** 'CdeInsertCardanoAssetUtxo' parameters type */
export interface ICdeInsertCardanoAssetUtxoParams {
  address: string;
  amount: NumberOrString;
  asset_name?: string | null | void;
  cde_name: string;
  cip14_fingerprint: string;
  output_index: number;
  policy_id: string;
  tx_id: string;
}

/** 'CdeInsertCardanoAssetUtxo' return type */
export type ICdeInsertCardanoAssetUtxoResult = void;

/** 'CdeInsertCardanoAssetUtxo' query type */
export interface ICdeInsertCardanoAssetUtxoQuery {
  params: ICdeInsertCardanoAssetUtxoParams;
  result: ICdeInsertCardanoAssetUtxoResult;
}

const cdeInsertCardanoAssetUtxoIR: any = {"usedParamSet":{"cde_name":true,"address":true,"tx_id":true,"output_index":true,"amount":true,"cip14_fingerprint":true,"policy_id":true,"asset_name":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":174,"b":183}]},{"name":"address","required":true,"transform":{"type":"scalar"},"locs":[{"a":190,"b":198}]},{"name":"tx_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":205,"b":211}]},{"name":"output_index","required":true,"transform":{"type":"scalar"},"locs":[{"a":218,"b":231}]},{"name":"amount","required":true,"transform":{"type":"scalar"},"locs":[{"a":238,"b":245}]},{"name":"cip14_fingerprint","required":true,"transform":{"type":"scalar"},"locs":[{"a":252,"b":270}]},{"name":"policy_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":277,"b":287}]},{"name":"asset_name","required":false,"transform":{"type":"scalar"},"locs":[{"a":294,"b":304}]}],"statement":"INSERT INTO cde_cardano_asset_utxos(\n    cde_name,\n    address,\n    tx_id,\n    output_index, \n    amount,\n    cip14_fingerprint,\n    policy_id,\n    asset_name\n) VALUES (\n    :cde_name!,\n    :address!,\n    :tx_id!,\n    :output_index!,\n    :amount!,\n    :cip14_fingerprint!,\n    :policy_id!,\n    :asset_name\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_asset_utxos(
 *     cde_name,
 *     address,
 *     tx_id,
 *     output_index, 
 *     amount,
 *     cip14_fingerprint,
 *     policy_id,
 *     asset_name
 * ) VALUES (
 *     :cde_name!,
 *     :address!,
 *     :tx_id!,
 *     :output_index!,
 *     :amount!,
 *     :cip14_fingerprint!,
 *     :policy_id!,
 *     :asset_name
 * )
 * ```
 */
export const cdeInsertCardanoAssetUtxo = new PreparedQuery<ICdeInsertCardanoAssetUtxoParams,ICdeInsertCardanoAssetUtxoResult>(cdeInsertCardanoAssetUtxoIR);


/** 'CdeSpendCardanoAssetUtxo' parameters type */
export interface ICdeSpendCardanoAssetUtxoParams {
  cip14_fingerprint: string;
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

const cdeSpendCardanoAssetUtxoIR: any = {"usedParamSet":{"tx_id":true,"output_index":true,"cip14_fingerprint":true},"params":[{"name":"tx_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":50,"b":56}]},{"name":"output_index","required":true,"transform":{"type":"scalar"},"locs":[{"a":77,"b":90}]},{"name":"cip14_fingerprint","required":true,"transform":{"type":"scalar"},"locs":[{"a":116,"b":134}]}],"statement":"DELETE FROM cde_cardano_asset_utxos\nWHERE tx_id = :tx_id!\nAND output_index = :output_index!\nAND cip14_fingerprint = :cip14_fingerprint!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM cde_cardano_asset_utxos
 * WHERE tx_id = :tx_id!
 * AND output_index = :output_index!
 * AND cip14_fingerprint = :cip14_fingerprint!
 * ```
 */
export const cdeSpendCardanoAssetUtxo = new PreparedQuery<ICdeSpendCardanoAssetUtxoParams,ICdeSpendCardanoAssetUtxoResult>(cdeSpendCardanoAssetUtxoIR);


