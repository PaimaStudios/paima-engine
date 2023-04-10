/** Types generated for queries found in "src/sql/cde-erc721.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'CdeErc721GetOwner' parameters type */
export interface ICdeErc721GetOwnerParams {
  cde_id: number;
  token_id: string;
}

/** 'CdeErc721GetOwner' return type */
export interface ICdeErc721GetOwnerResult {
  cde_id: number;
  nft_owner: string;
  token_id: string;
}

/** 'CdeErc721GetOwner' query type */
export interface ICdeErc721GetOwnerQuery {
  params: ICdeErc721GetOwnerParams;
  result: ICdeErc721GetOwnerResult;
}

const cdeErc721GetOwnerIR: any = {"usedParamSet":{"cde_id":true,"token_id":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":45,"b":52}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":69,"b":78}]}],"statement":"SELECT * FROM cde_erc721_data\nWHERE cde_id = :cde_id!\nAND token_id = :token_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc721_data
 * WHERE cde_id = :cde_id!
 * AND token_id = :token_id!
 * ```
 */
export const cdeErc721GetOwner = new PreparedQuery<ICdeErc721GetOwnerParams,ICdeErc721GetOwnerResult>(cdeErc721GetOwnerIR);


/** 'CdeErc721GetOwnedNfts' parameters type */
export interface ICdeErc721GetOwnedNftsParams {
  cde_id: number;
  nft_owner: string;
}

/** 'CdeErc721GetOwnedNfts' return type */
export interface ICdeErc721GetOwnedNftsResult {
  cde_id: number;
  nft_owner: string;
  token_id: string;
}

/** 'CdeErc721GetOwnedNfts' query type */
export interface ICdeErc721GetOwnedNftsQuery {
  params: ICdeErc721GetOwnedNftsParams;
  result: ICdeErc721GetOwnedNftsResult;
}

const cdeErc721GetOwnedNftsIR: any = {"usedParamSet":{"cde_id":true,"nft_owner":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":45,"b":52}]},{"name":"nft_owner","required":true,"transform":{"type":"scalar"},"locs":[{"a":70,"b":80}]}],"statement":"SELECT * FROM cde_erc721_data\nWHERE cde_id = :cde_id!\nAND nft_owner = :nft_owner!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc721_data
 * WHERE cde_id = :cde_id!
 * AND nft_owner = :nft_owner!
 * ```
 */
export const cdeErc721GetOwnedNfts = new PreparedQuery<ICdeErc721GetOwnedNftsParams,ICdeErc721GetOwnedNftsResult>(cdeErc721GetOwnedNftsIR);


/** 'CdeErc721InsertOwner' parameters type */
export interface ICdeErc721InsertOwnerParams {
  cde_id: number;
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

const cdeErc721InsertOwnerIR: any = {"usedParamSet":{"cde_id":true,"token_id":true,"nft_owner":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":84,"b":91}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":98,"b":107}]},{"name":"nft_owner","required":true,"transform":{"type":"scalar"},"locs":[{"a":114,"b":124}]}],"statement":"INSERT INTO cde_erc721_data(\n    cde_id,\n    token_id,\n    nft_owner\n) VALUES (\n    :cde_id!,\n    :token_id!,\n    :nft_owner!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_erc721_data(
 *     cde_id,
 *     token_id,
 *     nft_owner
 * ) VALUES (
 *     :cde_id!,
 *     :token_id!,
 *     :nft_owner!
 * )
 * ```
 */
export const cdeErc721InsertOwner = new PreparedQuery<ICdeErc721InsertOwnerParams,ICdeErc721InsertOwnerResult>(cdeErc721InsertOwnerIR);


/** 'CdeErc721UpdateOwner' parameters type */
export interface ICdeErc721UpdateOwnerParams {
  cde_id: number;
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

const cdeErc721UpdateOwnerIR: any = {"usedParamSet":{"nft_owner":true,"cde_id":true,"token_id":true},"params":[{"name":"nft_owner","required":true,"transform":{"type":"scalar"},"locs":[{"a":43,"b":53}]},{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":70,"b":77}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":94,"b":103}]}],"statement":"UPDATE cde_erc721_data\nSET\n    nft_owner = :nft_owner!\nWHERE cde_id = :cde_id!\nAND token_id = :token_id!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE cde_erc721_data
 * SET
 *     nft_owner = :nft_owner!
 * WHERE cde_id = :cde_id!
 * AND token_id = :token_id!
 * ```
 */
export const cdeErc721UpdateOwner = new PreparedQuery<ICdeErc721UpdateOwnerParams,ICdeErc721UpdateOwnerResult>(cdeErc721UpdateOwnerIR);


