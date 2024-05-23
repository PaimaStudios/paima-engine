/** Types generated for queries found in "src/sql/cde-erc6551-registry.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'CdeErc6551GetOwner' parameters type */
export interface ICdeErc6551GetOwnerParams {
  account_created: string;
  cde_name: string;
}

/** 'CdeErc6551GetOwner' return type */
export interface ICdeErc6551GetOwnerResult {
  account_created: string;
  block_height: number;
  cde_name: string;
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

const cdeErc6551GetOwnerIR: any = {"usedParamSet":{"cde_name":true,"account_created":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":57,"b":66}]},{"name":"account_created","required":true,"transform":{"type":"scalar"},"locs":[{"a":90,"b":106}]}],"statement":"SELECT * FROM cde_erc6551_registry_data\nWHERE cde_name = :cde_name!\nAND account_created = :account_created!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc6551_registry_data
 * WHERE cde_name = :cde_name!
 * AND account_created = :account_created!
 * ```
 */
export const cdeErc6551GetOwner = new PreparedQuery<ICdeErc6551GetOwnerParams,ICdeErc6551GetOwnerResult>(cdeErc6551GetOwnerIR);


/** 'CdeErc6551GetOwnedAccounts' parameters type */
export interface ICdeErc6551GetOwnedAccountsParams {
  cde_name: string;
  token_contract: string;
  token_id: string;
}

/** 'CdeErc6551GetOwnedAccounts' return type */
export interface ICdeErc6551GetOwnedAccountsResult {
  account_created: string;
  block_height: number;
  cde_name: string;
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

const cdeErc6551GetOwnedAccountsIR: any = {"usedParamSet":{"cde_name":true,"token_contract":true,"token_id":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":57,"b":66}]},{"name":"token_contract","required":true,"transform":{"type":"scalar"},"locs":[{"a":89,"b":104}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":121,"b":130}]}],"statement":"SELECT * FROM cde_erc6551_registry_data\nWHERE cde_name = :cde_name!\nAND token_contract = :token_contract!\nAND token_id = :token_id!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_erc6551_registry_data
 * WHERE cde_name = :cde_name!
 * AND token_contract = :token_contract!
 * AND token_id = :token_id!
 * ```
 */
export const cdeErc6551GetOwnedAccounts = new PreparedQuery<ICdeErc6551GetOwnedAccountsParams,ICdeErc6551GetOwnedAccountsResult>(cdeErc6551GetOwnedAccountsIR);


/** 'CdeErc6551InsertRegistry' parameters type */
export interface ICdeErc6551InsertRegistryParams {
  account_created: string;
  block_height: number;
  cde_name: string;
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

const cdeErc6551InsertRegistryIR: any = {"usedParamSet":{"cde_name":true,"block_height":true,"account_created":true,"implementation":true,"token_contract":true,"token_id":true,"chain_id":true,"salt":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":184,"b":193}]},{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":200,"b":213}]},{"name":"account_created","required":true,"transform":{"type":"scalar"},"locs":[{"a":220,"b":236}]},{"name":"implementation","required":true,"transform":{"type":"scalar"},"locs":[{"a":243,"b":258}]},{"name":"token_contract","required":true,"transform":{"type":"scalar"},"locs":[{"a":265,"b":280}]},{"name":"token_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":287,"b":296}]},{"name":"chain_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":303,"b":312}]},{"name":"salt","required":true,"transform":{"type":"scalar"},"locs":[{"a":319,"b":324}]}],"statement":"INSERT INTO cde_erc6551_registry_data(\n    cde_name,\n    block_height,\n    account_created,\n    implementation,\n    token_contract,\n    token_id,\n    chain_id,\n    salt\n) VALUES (\n    :cde_name!,\n    :block_height!,\n    :account_created!,\n    :implementation!,\n    :token_contract!,\n    :token_id!,\n    :chain_id!,\n    :salt!\n)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_erc6551_registry_data(
 *     cde_name,
 *     block_height,
 *     account_created,
 *     implementation,
 *     token_contract,
 *     token_id,
 *     chain_id,
 *     salt
 * ) VALUES (
 *     :cde_name!,
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


