/** Types generated for queries found in "src/sql/emulated.sql" */
import { PreparedQuery } from '@pgtyped/query';

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


/** 'EmulatedStoreBlockHeight' parameters type */
export interface IEmulatedStoreBlockHeightParams {
  deployment_chain_block_height: number;
  emulated_block_height: number;
  second_timestamp: string;
}

/** 'EmulatedStoreBlockHeight' return type */
export type IEmulatedStoreBlockHeightResult = void;

/** 'EmulatedStoreBlockHeight' query type */
export interface IEmulatedStoreBlockHeightQuery {
  params: IEmulatedStoreBlockHeightParams;
  result: IEmulatedStoreBlockHeightResult;
}

const emulatedStoreBlockHeightIR: any = {"usedParamSet":{"deployment_chain_block_height":true,"second_timestamp":true,"emulated_block_height":true},"params":[{"name":"deployment_chain_block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":134,"b":164}]},{"name":"second_timestamp","required":true,"transform":{"type":"scalar"},"locs":[{"a":171,"b":188}]},{"name":"emulated_block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":195,"b":217}]}],"statement":"INSERT INTO emulated_block_heights(\n    deployment_chain_block_height,\n    second_timestamp,\n    emulated_block_height\n) VALUES (\n    :deployment_chain_block_height!,\n    :second_timestamp!,\n    :emulated_block_height!\n) ON CONFLICT (deployment_chain_block_height)\nDO UPDATE SET\ndeployment_chain_block_height = EXCLUDED.deployment_chain_block_height,\nsecond_timestamp = EXCLUDED.second_timestamp,\nemulated_block_height = EXCLUDED.emulated_block_height"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO emulated_block_heights(
 *     deployment_chain_block_height,
 *     second_timestamp,
 *     emulated_block_height
 * ) VALUES (
 *     :deployment_chain_block_height!,
 *     :second_timestamp!,
 *     :emulated_block_height!
 * ) ON CONFLICT (deployment_chain_block_height)
 * DO UPDATE SET
 * deployment_chain_block_height = EXCLUDED.deployment_chain_block_height,
 * second_timestamp = EXCLUDED.second_timestamp,
 * emulated_block_height = EXCLUDED.emulated_block_height
 * ```
 */
export const emulatedStoreBlockHeight = new PreparedQuery<IEmulatedStoreBlockHeightParams,IEmulatedStoreBlockHeightResult>(emulatedStoreBlockHeightIR);


