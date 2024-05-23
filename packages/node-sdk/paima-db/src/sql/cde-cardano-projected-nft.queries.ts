/** Types generated for queries found in "src/sql/cde-cardano-projected-nft.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type NumberOrString = number | string;

/** 'CdeCardanoGetProjectedNft' parameters type */
export interface ICdeCardanoGetProjectedNftParams {
  owner_address: string;
}

/** 'CdeCardanoGetProjectedNft' return type */
export interface ICdeCardanoGetProjectedNftResult {
  amount: string;
  asset_name: string;
  cde_name: string;
  current_tx_hash: string;
  current_tx_output_index: number | null;
  for_how_long: string | null;
  id: number;
  owner_address: string;
  plutus_datum: string;
  policy_id: string;
  previous_tx_hash: string | null;
  previous_tx_output_index: number | null;
  status: string;
}

/** 'CdeCardanoGetProjectedNft' query type */
export interface ICdeCardanoGetProjectedNftQuery {
  params: ICdeCardanoGetProjectedNftParams;
  result: ICdeCardanoGetProjectedNftResult;
}

const cdeCardanoGetProjectedNftIR: any = {"usedParamSet":{"owner_address":true},"params":[{"name":"owner_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":62,"b":76}]}],"statement":"SELECT * FROM cde_cardano_projected_nft\nWHERE owner_address = :owner_address!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_cardano_projected_nft
 * WHERE owner_address = :owner_address!
 * ```
 */
export const cdeCardanoGetProjectedNft = new PreparedQuery<ICdeCardanoGetProjectedNftParams,ICdeCardanoGetProjectedNftResult>(cdeCardanoGetProjectedNftIR);


/** 'CdeCardanoProjectedNftInsertData' parameters type */
export interface ICdeCardanoProjectedNftInsertDataParams {
  amount: NumberOrString;
  asset_name: string;
  cde_name: string;
  current_tx_hash: string;
  current_tx_output_index: number;
  for_how_long: NumberOrString;
  owner_address: string;
  plutus_datum: string;
  policy_id: string;
  status: string;
}

/** 'CdeCardanoProjectedNftInsertData' return type */
export type ICdeCardanoProjectedNftInsertDataResult = void;

/** 'CdeCardanoProjectedNftInsertData' query type */
export interface ICdeCardanoProjectedNftInsertDataQuery {
  params: ICdeCardanoProjectedNftInsertDataParams;
  result: ICdeCardanoProjectedNftInsertDataResult;
}

const cdeCardanoProjectedNftInsertDataIR: any = {"usedParamSet":{"cde_name":true,"owner_address":true,"current_tx_hash":true,"current_tx_output_index":true,"policy_id":true,"asset_name":true,"amount":true,"status":true,"plutus_datum":true,"for_how_long":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":236,"b":245}]},{"name":"owner_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":261,"b":275}]},{"name":"current_tx_hash","required":true,"transform":{"type":"scalar"},"locs":[{"a":291,"b":307}]},{"name":"current_tx_output_index","required":true,"transform":{"type":"scalar"},"locs":[{"a":323,"b":347}]},{"name":"policy_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":363,"b":373}]},{"name":"asset_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":389,"b":400}]},{"name":"amount","required":true,"transform":{"type":"scalar"},"locs":[{"a":416,"b":423}]},{"name":"status","required":true,"transform":{"type":"scalar"},"locs":[{"a":439,"b":446}]},{"name":"plutus_datum","required":true,"transform":{"type":"scalar"},"locs":[{"a":462,"b":475}]},{"name":"for_how_long","required":true,"transform":{"type":"scalar"},"locs":[{"a":491,"b":504}]}],"statement":"INSERT INTO cde_cardano_projected_nft(\n    cde_name,\n    owner_address,\n    current_tx_hash,\n    current_tx_output_index,\n    policy_id,\n    asset_name,\n    amount,\n    status,\n    plutus_datum,\n    for_how_long\n) VALUES (\n             :cde_name!,\n             :owner_address!,\n             :current_tx_hash!,\n             :current_tx_output_index!,\n             :policy_id!,\n             :asset_name!,\n             :amount!,\n             :status!,\n             :plutus_datum!,\n             :for_how_long!\n         )"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_projected_nft(
 *     cde_name,
 *     owner_address,
 *     current_tx_hash,
 *     current_tx_output_index,
 *     policy_id,
 *     asset_name,
 *     amount,
 *     status,
 *     plutus_datum,
 *     for_how_long
 * ) VALUES (
 *              :cde_name!,
 *              :owner_address!,
 *              :current_tx_hash!,
 *              :current_tx_output_index!,
 *              :policy_id!,
 *              :asset_name!,
 *              :amount!,
 *              :status!,
 *              :plutus_datum!,
 *              :for_how_long!
 *          )
 * ```
 */
export const cdeCardanoProjectedNftInsertData = new PreparedQuery<ICdeCardanoProjectedNftInsertDataParams,ICdeCardanoProjectedNftInsertDataResult>(cdeCardanoProjectedNftInsertDataIR);


/** 'CdeCardanoProjectedNftUpdateData' parameters type */
export interface ICdeCardanoProjectedNftUpdateDataParams {
  amount: NumberOrString;
  asset_name: string;
  cde_name: string;
  for_how_long: NumberOrString;
  new_tx_hash: string;
  new_tx_output_index: number;
  owner_address: string;
  plutus_datum: string;
  policy_id: string;
  previous_tx_hash: string;
  previous_tx_output_index: number;
  status: string;
}

/** 'CdeCardanoProjectedNftUpdateData' return type */
export interface ICdeCardanoProjectedNftUpdateDataResult {
  previous_tx_hash: string | null;
  previous_tx_output_index: number | null;
}

/** 'CdeCardanoProjectedNftUpdateData' query type */
export interface ICdeCardanoProjectedNftUpdateDataQuery {
  params: ICdeCardanoProjectedNftUpdateDataParams;
  result: ICdeCardanoProjectedNftUpdateDataResult;
}

const cdeCardanoProjectedNftUpdateDataIR: any = {"usedParamSet":{"owner_address":true,"previous_tx_hash":true,"previous_tx_output_index":true,"new_tx_hash":true,"new_tx_output_index":true,"status":true,"plutus_datum":true,"for_how_long":true,"cde_name":true,"policy_id":true,"asset_name":true,"amount":true},"params":[{"name":"owner_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":57,"b":71}]},{"name":"previous_tx_hash","required":true,"transform":{"type":"scalar"},"locs":[{"a":97,"b":114},{"a":416,"b":433}]},{"name":"previous_tx_output_index","required":true,"transform":{"type":"scalar"},"locs":[{"a":148,"b":173},{"a":469,"b":494}]},{"name":"new_tx_hash","required":true,"transform":{"type":"scalar"},"locs":[{"a":198,"b":210}]},{"name":"new_tx_output_index","required":true,"transform":{"type":"scalar"},"locs":[{"a":243,"b":263}]},{"name":"status","required":true,"transform":{"type":"scalar"},"locs":[{"a":279,"b":286}]},{"name":"plutus_datum","required":true,"transform":{"type":"scalar"},"locs":[{"a":308,"b":321}]},{"name":"for_how_long","required":true,"transform":{"type":"scalar"},"locs":[{"a":343,"b":356}]},{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":379,"b":388}]},{"name":"policy_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":516,"b":526}]},{"name":"asset_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":549,"b":560}]},{"name":"amount","required":true,"transform":{"type":"scalar"},"locs":[{"a":579,"b":586}]}],"statement":"UPDATE cde_cardano_projected_nft\nSET\n    owner_address = :owner_address!,\n    previous_tx_hash = :previous_tx_hash!,\n    previous_tx_output_index = :previous_tx_output_index!,\n    current_tx_hash = :new_tx_hash!,\n    current_tx_output_index = :new_tx_output_index!,\n    status = :status!,\n    plutus_datum = :plutus_datum!,\n    for_how_long = :for_how_long!\nWHERE\n    cde_name = :cde_name!\n    AND current_tx_hash = :previous_tx_hash!\n    AND current_tx_output_index = :previous_tx_output_index!\n    AND policy_id = :policy_id!\n    AND asset_name = :asset_name!\n    AND amount = :amount!\nRETURNING previous_tx_hash, previous_tx_output_index"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE cde_cardano_projected_nft
 * SET
 *     owner_address = :owner_address!,
 *     previous_tx_hash = :previous_tx_hash!,
 *     previous_tx_output_index = :previous_tx_output_index!,
 *     current_tx_hash = :new_tx_hash!,
 *     current_tx_output_index = :new_tx_output_index!,
 *     status = :status!,
 *     plutus_datum = :plutus_datum!,
 *     for_how_long = :for_how_long!
 * WHERE
 *     cde_name = :cde_name!
 *     AND current_tx_hash = :previous_tx_hash!
 *     AND current_tx_output_index = :previous_tx_output_index!
 *     AND policy_id = :policy_id!
 *     AND asset_name = :asset_name!
 *     AND amount = :amount!
 * RETURNING previous_tx_hash, previous_tx_output_index
 * ```
 */
export const cdeCardanoProjectedNftUpdateData = new PreparedQuery<ICdeCardanoProjectedNftUpdateDataParams,ICdeCardanoProjectedNftUpdateDataResult>(cdeCardanoProjectedNftUpdateDataIR);


