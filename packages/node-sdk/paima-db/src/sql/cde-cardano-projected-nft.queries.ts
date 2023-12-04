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
  asset: string;
  cde_id: number;
  current_tx_hash: string;
  current_tx_output_index: number | null;
  for_how_long: string | null;
  id: number;
  owner_address: string;
  plutus_datum: string;
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
  asset: string;
  cde_id: number;
  current_tx_hash: string;
  current_tx_output_index: number;
  for_how_long: NumberOrString;
  owner_address: string;
  plutus_datum: string;
  status: string;
}

/** 'CdeCardanoProjectedNftInsertData' return type */
export type ICdeCardanoProjectedNftInsertDataResult = void;

/** 'CdeCardanoProjectedNftInsertData' query type */
export interface ICdeCardanoProjectedNftInsertDataQuery {
  params: ICdeCardanoProjectedNftInsertDataParams;
  result: ICdeCardanoProjectedNftInsertDataResult;
}

const cdeCardanoProjectedNftInsertDataIR: any = {"usedParamSet":{"cde_id":true,"owner_address":true,"current_tx_hash":true,"current_tx_output_index":true,"asset":true,"amount":true,"status":true,"plutus_datum":true,"for_how_long":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":214,"b":221}]},{"name":"owner_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":237,"b":251}]},{"name":"current_tx_hash","required":true,"transform":{"type":"scalar"},"locs":[{"a":267,"b":283}]},{"name":"current_tx_output_index","required":true,"transform":{"type":"scalar"},"locs":[{"a":299,"b":323}]},{"name":"asset","required":true,"transform":{"type":"scalar"},"locs":[{"a":339,"b":345}]},{"name":"amount","required":true,"transform":{"type":"scalar"},"locs":[{"a":361,"b":368}]},{"name":"status","required":true,"transform":{"type":"scalar"},"locs":[{"a":384,"b":391}]},{"name":"plutus_datum","required":true,"transform":{"type":"scalar"},"locs":[{"a":407,"b":420}]},{"name":"for_how_long","required":true,"transform":{"type":"scalar"},"locs":[{"a":436,"b":449}]}],"statement":"INSERT INTO cde_cardano_projected_nft(\n    cde_id,\n    owner_address,\n    current_tx_hash,\n    current_tx_output_index,\n    asset,\n    amount,\n    status,\n    plutus_datum,\n    for_how_long\n) VALUES (\n             :cde_id!,\n             :owner_address!,\n             :current_tx_hash!,\n             :current_tx_output_index!,\n             :asset!,\n             :amount!,\n             :status!,\n             :plutus_datum!,\n             :for_how_long!\n         )"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_cardano_projected_nft(
 *     cde_id,
 *     owner_address,
 *     current_tx_hash,
 *     current_tx_output_index,
 *     asset,
 *     amount,
 *     status,
 *     plutus_datum,
 *     for_how_long
 * ) VALUES (
 *              :cde_id!,
 *              :owner_address!,
 *              :current_tx_hash!,
 *              :current_tx_output_index!,
 *              :asset!,
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
  asset: string;
  cde_id: number;
  for_how_long: NumberOrString;
  new_tx_hash: string;
  new_tx_output_index: number;
  owner_address: string;
  plutus_datum: string;
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

const cdeCardanoProjectedNftUpdateDataIR: any = {"usedParamSet":{"previous_tx_hash":true,"previous_tx_output_index":true,"new_tx_hash":true,"new_tx_output_index":true,"status":true,"plutus_datum":true,"for_how_long":true,"cde_id":true,"owner_address":true,"asset":true,"amount":true},"params":[{"name":"previous_tx_hash","required":true,"transform":{"type":"scalar"},"locs":[{"a":60,"b":77},{"a":415,"b":432}]},{"name":"previous_tx_output_index","required":true,"transform":{"type":"scalar"},"locs":[{"a":111,"b":136},{"a":468,"b":493}]},{"name":"new_tx_hash","required":true,"transform":{"type":"scalar"},"locs":[{"a":161,"b":173}]},{"name":"new_tx_output_index","required":true,"transform":{"type":"scalar"},"locs":[{"a":206,"b":226}]},{"name":"status","required":true,"transform":{"type":"scalar"},"locs":[{"a":242,"b":249}]},{"name":"plutus_datum","required":true,"transform":{"type":"scalar"},"locs":[{"a":271,"b":284}]},{"name":"for_how_long","required":true,"transform":{"type":"scalar"},"locs":[{"a":306,"b":319}]},{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":340,"b":347}]},{"name":"owner_address","required":true,"transform":{"type":"scalar"},"locs":[{"a":373,"b":387}]},{"name":"asset","required":true,"transform":{"type":"scalar"},"locs":[{"a":511,"b":517}]},{"name":"amount","required":true,"transform":{"type":"scalar"},"locs":[{"a":536,"b":543}]}],"statement":"UPDATE cde_cardano_projected_nft\nSET\n    previous_tx_hash = :previous_tx_hash!,\n    previous_tx_output_index = :previous_tx_output_index!,\n    current_tx_hash = :new_tx_hash!,\n    current_tx_output_index = :new_tx_output_index!,\n    status = :status!,\n    plutus_datum = :plutus_datum!,\n    for_how_long = :for_how_long!\nWHERE\n    cde_id = :cde_id!\n    AND owner_address = :owner_address!\n    AND current_tx_hash = :previous_tx_hash!\n    AND current_tx_output_index = :previous_tx_output_index!\n    AND asset = :asset!\n    AND amount = :amount!\nRETURNING previous_tx_hash, previous_tx_output_index"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE cde_cardano_projected_nft
 * SET
 *     previous_tx_hash = :previous_tx_hash!,
 *     previous_tx_output_index = :previous_tx_output_index!,
 *     current_tx_hash = :new_tx_hash!,
 *     current_tx_output_index = :new_tx_output_index!,
 *     status = :status!,
 *     plutus_datum = :plutus_datum!,
 *     for_how_long = :for_how_long!
 * WHERE
 *     cde_id = :cde_id!
 *     AND owner_address = :owner_address!
 *     AND current_tx_hash = :previous_tx_hash!
 *     AND current_tx_output_index = :previous_tx_output_index!
 *     AND asset = :asset!
 *     AND amount = :amount!
 * RETURNING previous_tx_hash, previous_tx_output_index
 * ```
 */
export const cdeCardanoProjectedNftUpdateData = new PreparedQuery<ICdeCardanoProjectedNftUpdateDataParams,ICdeCardanoProjectedNftUpdateDataResult>(cdeCardanoProjectedNftUpdateDataIR);


