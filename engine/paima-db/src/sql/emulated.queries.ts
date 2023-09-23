/** Types generated for queries found in "src/sql/emulated.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'EmulatedSelectLatestPrior' parameters type */
export interface IEmulatedSelectLatestPriorParams {
  emulated_block_height: number;
}

/** 'EmulatedSelectLatestPrior' return type */
export interface IEmulatedSelectLatestPriorResult {
  deployment_chain_block_height: number;
  emulated_block_height: number;
  second_timestamp: string;
}

/** 'EmulatedSelectLatestPrior' query type */
export interface IEmulatedSelectLatestPriorQuery {
  params: IEmulatedSelectLatestPriorParams;
  result: IEmulatedSelectLatestPriorResult;
}

const emulatedSelectLatestPriorIR: any = {"usedParamSet":{"emulated_block_height":true},"params":[{"name":"emulated_block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":68,"b":90}]}],"statement":"SELECT * FROM emulated_block_heights\nWHERE emulated_block_height <= :emulated_block_height!\nORDER BY deployment_chain_block_height DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM emulated_block_heights
 * WHERE emulated_block_height <= :emulated_block_height!
 * ORDER BY deployment_chain_block_height DESC
 * LIMIT 1
 * ```
 */
export const emulatedSelectLatestPrior = new PreparedQuery<IEmulatedSelectLatestPriorParams,IEmulatedSelectLatestPriorResult>(emulatedSelectLatestPriorIR);


/** 'UpsertEmulatedBlockheight' parameters type */
export interface IUpsertEmulatedBlockheightParams {
  items: readonly ({
    deployment_chain_block_height: number | null | void,
    second_timestamp: string | null | void,
    emulated_block_height: number | null | void
  })[];
}

/** 'UpsertEmulatedBlockheight' return type */
export type IUpsertEmulatedBlockheightResult = void;

/** 'UpsertEmulatedBlockheight' query type */
export interface IUpsertEmulatedBlockheightQuery {
  params: IUpsertEmulatedBlockheightParams;
  result: IUpsertEmulatedBlockheightResult;
}

const upsertEmulatedBlockheightIR: any = {"usedParamSet":{"items":true},"params":[{"name":"items","required":true,"transform":{"type":"pick_array_spread","keys":[{"name":"deployment_chain_block_height","required":false},{"name":"second_timestamp","required":false},{"name":"emulated_block_height","required":false}]},"locs":[{"a":128,"b":134}]}],"statement":"INSERT INTO emulated_block_heights(\n    deployment_chain_block_height,\n    second_timestamp,\n    emulated_block_height\n) VALUES :items!\nON CONFLICT DO NOTHING"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO emulated_block_heights(
 *     deployment_chain_block_height,
 *     second_timestamp,
 *     emulated_block_height
 * ) VALUES :items!
 * ON CONFLICT DO NOTHING
 * ```
 */
export const upsertEmulatedBlockheight = new PreparedQuery<IUpsertEmulatedBlockheightParams,IUpsertEmulatedBlockheightResult>(upsertEmulatedBlockheightIR);


/** 'DeploymentChainBlockheightToEmulated' parameters type */
export interface IDeploymentChainBlockheightToEmulatedParams {
  deployment_chain_block_height: number;
}

/** 'DeploymentChainBlockheightToEmulated' return type */
export interface IDeploymentChainBlockheightToEmulatedResult {
  emulated_block_height: number;
}

/** 'DeploymentChainBlockheightToEmulated' query type */
export interface IDeploymentChainBlockheightToEmulatedQuery {
  params: IDeploymentChainBlockheightToEmulatedParams;
  result: IDeploymentChainBlockheightToEmulatedResult;
}

const deploymentChainBlockheightToEmulatedIR: any = {"usedParamSet":{"deployment_chain_block_height":true},"params":[{"name":"deployment_chain_block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":95,"b":125}]}],"statement":"SELECT emulated_block_height FROM emulated_block_heights\nWHERE deployment_chain_block_height = :deployment_chain_block_height!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT emulated_block_height FROM emulated_block_heights
 * WHERE deployment_chain_block_height = :deployment_chain_block_height!
 * ```
 */
export const deploymentChainBlockheightToEmulated = new PreparedQuery<IDeploymentChainBlockheightToEmulatedParams,IDeploymentChainBlockheightToEmulatedResult>(deploymentChainBlockheightToEmulatedIR);


/** 'EmulatedBlockheightToDeploymentChain' parameters type */
export interface IEmulatedBlockheightToDeploymentChainParams {
  emulated_block_height: number;
}

/** 'EmulatedBlockheightToDeploymentChain' return type */
export interface IEmulatedBlockheightToDeploymentChainResult {
  deployment_chain_block_height: number;
}

/** 'EmulatedBlockheightToDeploymentChain' query type */
export interface IEmulatedBlockheightToDeploymentChainQuery {
  params: IEmulatedBlockheightToDeploymentChainParams;
  result: IEmulatedBlockheightToDeploymentChainResult;
}

const emulatedBlockheightToDeploymentChainIR: any = {"usedParamSet":{"emulated_block_height":true},"params":[{"name":"emulated_block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":95,"b":117}]}],"statement":"SELECT deployment_chain_block_height FROM emulated_block_heights\nWHERE emulated_block_height = :emulated_block_height!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT deployment_chain_block_height FROM emulated_block_heights
 * WHERE emulated_block_height = :emulated_block_height!
 * ```
 */
export const emulatedBlockheightToDeploymentChain = new PreparedQuery<IEmulatedBlockheightToDeploymentChainParams,IEmulatedBlockheightToDeploymentChainResult>(emulatedBlockheightToDeploymentChainIR);


