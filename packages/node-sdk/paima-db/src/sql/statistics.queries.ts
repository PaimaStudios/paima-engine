/** Types generated for queries found in "src/sql/statistics.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetInputsTotal' parameters type */
export type IGetInputsTotalParams = void;

/** 'GetInputsTotal' return type */
export interface IGetInputsTotalResult {
  game_inputs: string;
  scheduled_data: string;
}

/** 'GetInputsTotal' query type */
export interface IGetInputsTotalQuery {
  params: IGetInputsTotalParams;
  result: IGetInputsTotalResult;
}

const getInputsTotalIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT\n    (SELECT COUNT(*) FROM historical_game_inputs) AS \"game_inputs!\",\n    (SELECT COUNT(*) FROM scheduled_data) AS \"scheduled_data!\""};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     (SELECT COUNT(*) FROM historical_game_inputs) AS "game_inputs!",
 *     (SELECT COUNT(*) FROM scheduled_data) AS "scheduled_data!"
 * ```
 */
export const getInputsTotal = new PreparedQuery<IGetInputsTotalParams,IGetInputsTotalResult>(getInputsTotalIR);


/** 'GetInputsForBlock' parameters type */
export interface IGetInputsForBlockParams {
  block_height: number;
}

/** 'GetInputsForBlock' return type */
export interface IGetInputsForBlockResult {
  game_inputs: string;
  scheduled_data: string;
}

/** 'GetInputsForBlock' query type */
export interface IGetInputsForBlockQuery {
  params: IGetInputsForBlockParams;
  result: IGetInputsForBlockResult;
}

const getInputsForBlockIR: any = {"usedParamSet":{"block_height":true},"params":[{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":96,"b":109},{"a":217,"b":230}]}],"statement":"SELECT\n    (\n      SELECT COUNT(*)\n      FROM historical_game_inputs\n      WHERE block_height = :block_height!\n    ) AS \"game_inputs!\",\n    (\n      SELECT COUNT(*)\n      FROM scheduled_data\n      WHERE block_height = :block_height!\n    ) AS \"scheduled_data!\""};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     (
 *       SELECT COUNT(*)
 *       FROM historical_game_inputs
 *       WHERE block_height = :block_height!
 *     ) AS "game_inputs!",
 *     (
 *       SELECT COUNT(*)
 *       FROM scheduled_data
 *       WHERE block_height = :block_height!
 *     ) AS "scheduled_data!"
 * ```
 */
export const getInputsForBlock = new PreparedQuery<IGetInputsForBlockParams,IGetInputsForBlockResult>(getInputsForBlockIR);


/** 'GetInputsForAddress' parameters type */
export interface IGetInputsForAddressParams {
  addr: string;
  block_height: number;
}

/** 'GetInputsForAddress' return type */
export interface IGetInputsForAddressResult {
  game_inputs: string;
  scheduled_data: string;
}

/** 'GetInputsForAddress' query type */
export interface IGetInputsForAddressQuery {
  params: IGetInputsForAddressParams;
  result: IGetInputsForAddressResult;
}

const getInputsForAddressIR: any = {"usedParamSet":{"addr":true,"block_height":true},"params":[{"name":"addr","required":true,"transform":{"type":"scalar"},"locs":[{"a":104,"b":109},{"a":359,"b":364}]},{"name":"block_height","required":true,"transform":{"type":"scalar"},"locs":[{"a":138,"b":151},{"a":393,"b":406}]}],"statement":"SELECT\n    (\n      SELECT COUNT(*)\n      FROM historical_game_inputs\n      WHERE\n        user_address = :addr! AND\n        block_height = :block_height!\n    ) AS \"game_inputs!\",\n    (\n      SELECT COUNT(*)\n      FROM scheduled_data\n      LEFT JOIN scheduled_data_precompile ON scheduled_data.id = scheduled_data_precompile.id\n      WHERE\n        precompile = :addr! AND\n        block_height = :block_height!\n    ) AS \"scheduled_data!\""};

/**
 * Query generated from SQL:
 * ```
 * SELECT
 *     (
 *       SELECT COUNT(*)
 *       FROM historical_game_inputs
 *       WHERE
 *         user_address = :addr! AND
 *         block_height = :block_height!
 *     ) AS "game_inputs!",
 *     (
 *       SELECT COUNT(*)
 *       FROM scheduled_data
 *       LEFT JOIN scheduled_data_precompile ON scheduled_data.id = scheduled_data_precompile.id
 *       WHERE
 *         precompile = :addr! AND
 *         block_height = :block_height!
 *     ) AS "scheduled_data!"
 * ```
 */
export const getInputsForAddress = new PreparedQuery<IGetInputsForAddressParams,IGetInputsForAddressResult>(getInputsForAddressIR);


