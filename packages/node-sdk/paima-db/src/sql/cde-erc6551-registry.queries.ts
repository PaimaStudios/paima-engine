/** Types generated for queries found in "src/sql/cde-erc6551-registry.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CdeErc6551GetOwner' parameters type */
export interface ICdeErc6551GetOwnerParams {
  account_created: string;
  cde_id: number;
}

/** 'CdeErc6551GetOwner' return type */
export interface ICdeErc6551GetOwnerResult {
  account_created: string;
  block_height: number;
  cde_id: number;
  chain_id: string;
  implementation: string;
  salt: string;
  token_contract: string;
  token_id: string;
}

/** 'CdeErc6551GetOwner' query type */
export interface ICdeErc6551GetOwnerQuery {
  params: ICdeErc6551GetOwnerParams;
  result: ICdeErc6551GetOwnerResult;
}

const cdeErc6551GetOwnerIR: any = {"usedParamSet":{"cde_id":true,"account_created":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":55,"b":62}]},{"name":"account_created","required":true,"transform":{"type":"scalar"},"locs":[{"a":86,"b":102}]}],"statement":"SELECT * FROM cde_erc6551_registry_data\nWHERE cde_id = :cde_id!\nAND account_created = :account_created!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc6551_registry_data
 * WHERE cde_id = :cde_id!
 * AND account_created = :account_created!
 * ```
 */
export const cdeErc6551GetOwner = new PreparedQuery<ICdeErc6551GetOwnerParams,ICdeErc6551GetOwnerResult>(cdeErc6551GetOwnerIR);


/** 'CdeErc6551GetOwnedAccounts' parameters type */
export interface ICdeErc6551GetOwnedAccountsParams {
  cde_id: number;
  token_contract: string;
  token_id: string;
}

/** 'CdeErc6551GetOwnedAccounts' return type */
export interface ICdeErc6551GetOwnedAccountsResult {
  account_created: string;
  block_height: number;
  cde_id: number;
  chain_id: string;
  implementation: string;
  salt: string;
  token_contract: string;
  token_id: string;
}

/** 'CdeErc6551GetOwnedAccounts' query type */
export interface ICdeErc6551GetOwnedAccountsQuery {
  params: ICdeErc6551GetOwnedAccountsParams;
  result: ICdeErc6551GetOwnedAccountsResult;
}

const cdeErc6551GetOwnedAccountsIR: any = {"usedParamSet":{"cde_id":true,"token_contract":true,"token_id":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":55,"b":62}]},{"name":"token_contract","required":true,"transform":{"type":"scalar"},"locs":[{"a":85,"b":100}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":117,"b":126}]}],"statement":"SELECT * FROM cde_erc6551_registry_data\nWHERE cde_id = :cde_id!\nAND token_contract = :token_contract!\nAND token_id = :token_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc6551_registry_data
 * WHERE cde_id = :cde_id!
 * AND token_contract = :token_contract!
 * AND token_id = :token_id!
 * ```
 */
export const cdeErc6551GetOwnedAccounts = new PreparedQuery<ICdeErc6551GetOwnedAccountsParams,ICdeErc6551GetOwnedAccountsResult>(cdeErc6551GetOwnedAccountsIR);


/** 'CdeErc6551InsertRegistry' parameters type */
export interface ICdeErc6551InsertRegistryParams {
  account_created: string;
  block_height: number;
  cde_id: number;
  chain_id: string;
  implementation: string;
  salt: string;
  token_contract: string;
  token_id: string;
}

/** 'CdeErc6551InsertRegistry' return type */
export type ICdeErc6551InsertRegistryResult = void;

/** 'CdeErc6551InsertRegistry' query type */
export interface ICdeErc6551InsertRegistryQuery {
  params: ICdeErc6551InsertRegistryParams;
  result: ICdeErc6551InsertRegistryResult;
}

const cdeErc6551InsertRegistryIR: any = {"usedParamSet":{"cde_id":true,"block_height":true,"account_created":true,"implementation":true,"token_contract":true,"token_id":true,"chain_id":true,"salt":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":182,"b":189}]},{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":196,"b":209}]},{"name":"account_created","required":true,"transform":{"type":"scalar"},"locs":[{"a":216,"b":232}]},{"name":"implementation","required":true,"transform":{"type":"scalar"},"locs":[{"a":239,"b":254}]},{"name":"token_contract","required":true,"transform":{"type":"scalar"},"locs":[{"a":261,"b":276}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":283,"b":292}]},{"name":"chain_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":299,"b":308}]},{"name":"salt","required":true,"transform":{"type":"scalar"},"locs":[{"a":315,"b":320}]}],"statement":"INSERT INTO cde_erc6551_registry_data(\n    cde_id,\n    block_height,\n    account_created,\n    implementation,\n    token_contract,\n    token_id,\n    chain_id,\n    salt\n) VALUES (\n    :cde_id!,\n    :block_height!,\n    :account_created!,\n    :implementation!,\n    :token_contract!,\n    :token_id!,\n    :chain_id!,\n    :salt!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_erc6551_registry_data(
 *     cde_id,
 *     block_height,
 *     account_created,
 *     implementation,
 *     token_contract,
 *     token_id,
 *     chain_id,
 *     salt
 * ) VALUES (
 *     :cde_id!,
 *     :block_height!,
 *     :account_created!,
 *     :implementation!,
 *     :token_contract!,
 *     :token_id!,
 *     :chain_id!,
 *     :salt!
 * )
 * ```
 */
export const cdeErc6551InsertRegistry = new PreparedQuery<ICdeErc6551InsertRegistryParams,ICdeErc6551InsertRegistryResult>(cdeErc6551InsertRegistryIR);


