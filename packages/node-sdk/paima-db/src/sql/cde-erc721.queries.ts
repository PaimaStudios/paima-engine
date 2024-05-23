/** Types generated for queries found in "src/sql/cde-erc721.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CdeErc721GetOwner' parameters type */
export interface ICdeErc721GetOwnerParams {
  cde_name: string;
  token_id: string;
}

/** 'CdeErc721GetOwner' return type */
export interface ICdeErc721GetOwnerResult {
  cde_name: string;
  nft_owner: string;
  token_id: string;
}

/** 'CdeErc721GetOwner' query type */
export interface ICdeErc721GetOwnerQuery {
  params: ICdeErc721GetOwnerParams;
  result: ICdeErc721GetOwnerResult;
}

const cdeErc721GetOwnerIR: any = {"usedParamSet":{"cde_name":true,"token_id":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":47,"b":56}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":73,"b":82}]}],"statement":"SELECT * FROM cde_erc721_data\nWHERE cde_name = :cde_name!\nAND token_id = :token_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc721_data
 * WHERE cde_name = :cde_name!
 * AND token_id = :token_id!
 * ```
 */
export const cdeErc721GetOwner = new PreparedQuery<ICdeErc721GetOwnerParams,ICdeErc721GetOwnerResult>(cdeErc721GetOwnerIR);


/** 'CdeErc721GetOwnedNfts' parameters type */
export interface ICdeErc721GetOwnedNftsParams {
  cde_name: string;
  nft_owner: string;
}

/** 'CdeErc721GetOwnedNfts' return type */
export interface ICdeErc721GetOwnedNftsResult {
  cde_name: string;
  nft_owner: string;
  token_id: string;
}

/** 'CdeErc721GetOwnedNfts' query type */
export interface ICdeErc721GetOwnedNftsQuery {
  params: ICdeErc721GetOwnedNftsParams;
  result: ICdeErc721GetOwnedNftsResult;
}

const cdeErc721GetOwnedNftsIR: any = {"usedParamSet":{"cde_name":true,"nft_owner":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":47,"b":56}]},{"name":"nft_owner","required":true,"transform":{"type":"scalar"},"locs":[{"a":74,"b":84}]}],"statement":"SELECT * FROM cde_erc721_data\nWHERE cde_name = :cde_name!\nAND nft_owner = :nft_owner!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc721_data
 * WHERE cde_name = :cde_name!
 * AND nft_owner = :nft_owner!
 * ```
 */
export const cdeErc721GetOwnedNfts = new PreparedQuery<ICdeErc721GetOwnedNftsParams,ICdeErc721GetOwnedNftsResult>(cdeErc721GetOwnedNftsIR);


/** 'CdeErc721InsertOwner' parameters type */
export interface ICdeErc721InsertOwnerParams {
  cde_name: string;
  nft_owner: string;
  token_id: string;
}

/** 'CdeErc721InsertOwner' return type */
export type ICdeErc721InsertOwnerResult = void;

/** 'CdeErc721InsertOwner' query type */
export interface ICdeErc721InsertOwnerQuery {
  params: ICdeErc721InsertOwnerParams;
  result: ICdeErc721InsertOwnerResult;
}

const cdeErc721InsertOwnerIR: any = {"usedParamSet":{"cde_name":true,"token_id":true,"nft_owner":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":86,"b":95}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":102,"b":111}]},{"name":"nft_owner","required":true,"transform":{"type":"scalar"},"locs":[{"a":118,"b":128}]}],"statement":"INSERT INTO cde_erc721_data(\n    cde_name,\n    token_id,\n    nft_owner\n) VALUES (\n    :cde_name!,\n    :token_id!,\n    :nft_owner!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_erc721_data(
 *     cde_name,
 *     token_id,
 *     nft_owner
 * ) VALUES (
 *     :cde_name!,
 *     :token_id!,
 *     :nft_owner!
 * )
 * ```
 */
export const cdeErc721InsertOwner = new PreparedQuery<ICdeErc721InsertOwnerParams,ICdeErc721InsertOwnerResult>(cdeErc721InsertOwnerIR);


/** 'CdeErc721UpdateOwner' parameters type */
export interface ICdeErc721UpdateOwnerParams {
  cde_name: string;
  nft_owner: string;
  token_id: string;
}

/** 'CdeErc721UpdateOwner' return type */
export type ICdeErc721UpdateOwnerResult = void;

/** 'CdeErc721UpdateOwner' query type */
export interface ICdeErc721UpdateOwnerQuery {
  params: ICdeErc721UpdateOwnerParams;
  result: ICdeErc721UpdateOwnerResult;
}

const cdeErc721UpdateOwnerIR: any = {"usedParamSet":{"nft_owner":true,"cde_name":true,"token_id":true},"params":[{"name":"nft_owner","required":true,"transform":{"type":"scalar"},"locs":[{"a":43,"b":53}]},{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":72,"b":81}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":98,"b":107}]}],"statement":"UPDATE cde_erc721_data\nSET\n    nft_owner = :nft_owner!\nWHERE cde_name = :cde_name!\nAND token_id = :token_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE cde_erc721_data
 * SET
 *     nft_owner = :nft_owner!
 * WHERE cde_name = :cde_name!
 * AND token_id = :token_id!
 * ```
 */
export const cdeErc721UpdateOwner = new PreparedQuery<ICdeErc721UpdateOwnerParams,ICdeErc721UpdateOwnerResult>(cdeErc721UpdateOwnerIR);


/** 'CdeErc721GetAllOwnedNfts' parameters type */
export interface ICdeErc721GetAllOwnedNftsParams {
  nft_owner: string;
}

/** 'CdeErc721GetAllOwnedNfts' return type */
export interface ICdeErc721GetAllOwnedNftsResult {
  cde_name: string;
  token_id: string;
}

/** 'CdeErc721GetAllOwnedNfts' query type */
export interface ICdeErc721GetAllOwnedNftsQuery {
  params: ICdeErc721GetAllOwnedNftsParams;
  result: ICdeErc721GetAllOwnedNftsResult;
}

const cdeErc721GetAllOwnedNftsIR: any = {"usedParamSet":{"nft_owner":true},"params":[{"name":"nft_owner","required":true,"transform":{"type":"scalar"},"locs":[{"a":176,"b":186}]}],"statement":"SELECT chain_data_extensions.cde_name, token_id  FROM cde_erc721_data\nJOIN chain_data_extensions ON chain_data_extensions.cde_name = cde_erc721_data.cde_name\nWHERE nft_owner = :nft_owner!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT chain_data_extensions.cde_name, token_id  FROM cde_erc721_data
 * JOIN chain_data_extensions ON chain_data_extensions.cde_name = cde_erc721_data.cde_name
 * WHERE nft_owner = :nft_owner!
 * ```
 */
export const cdeErc721GetAllOwnedNfts = new PreparedQuery<ICdeErc721GetAllOwnedNftsParams,ICdeErc721GetAllOwnedNftsResult>(cdeErc721GetAllOwnedNftsIR);


/** 'CdeErc721Delete' parameters type */
export interface ICdeErc721DeleteParams {
  cde_name: string;
  token_id: string;
}

/** 'CdeErc721Delete' return type */
export type ICdeErc721DeleteResult = void;

/** 'CdeErc721Delete' query type */
export interface ICdeErc721DeleteQuery {
  params: ICdeErc721DeleteParams;
  result: ICdeErc721DeleteResult;
}

const cdeErc721DeleteIR: any = {"usedParamSet":{"cde_name":true,"token_id":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":45,"b":54}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":71,"b":80}]}],"statement":"DELETE FROM cde_erc721_data\nWHERE cde_name = :cde_name!\nAND token_id = :token_id!"};

/**
 * Query generated from SQL:
 * ```
 * DELETE FROM cde_erc721_data
 * WHERE cde_name = :cde_name!
 * AND token_id = :token_id!
 * ```
 */
export const cdeErc721Delete = new PreparedQuery<ICdeErc721DeleteParams,ICdeErc721DeleteResult>(cdeErc721DeleteIR);


/** 'CdeErc721BurnInsert' parameters type */
export interface ICdeErc721BurnInsertParams {
  cde_name: string;
  nft_owner: string;
  token_id: string;
}

/** 'CdeErc721BurnInsert' return type */
export type ICdeErc721BurnInsertResult = void;

/** 'CdeErc721BurnInsert' query type */
export interface ICdeErc721BurnInsertQuery {
  params: ICdeErc721BurnInsertParams;
  result: ICdeErc721BurnInsertResult;
}

const cdeErc721BurnInsertIR: any = {"usedParamSet":{"cde_name":true,"token_id":true,"nft_owner":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":86,"b":95}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":102,"b":111}]},{"name":"nft_owner","required":true,"transform":{"type":"scalar"},"locs":[{"a":118,"b":128}]}],"statement":"INSERT INTO cde_erc721_burn(\n    cde_name,\n    token_id,\n    nft_owner\n) VALUES (\n    :cde_name!,\n    :token_id!,\n    :nft_owner!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_erc721_burn(
 *     cde_name,
 *     token_id,
 *     nft_owner
 * ) VALUES (
 *     :cde_name!,
 *     :token_id!,
 *     :nft_owner!
 * )
 * ```
 */
export const cdeErc721BurnInsert = new PreparedQuery<ICdeErc721BurnInsertParams,ICdeErc721BurnInsertResult>(cdeErc721BurnInsertIR);


