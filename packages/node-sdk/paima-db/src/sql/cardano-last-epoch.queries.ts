/** Types generated for queries found in "src/sql/cardano-last-epoch.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'UpdateCardanoEpoch' parameters type */
export interface IUpdateCardanoEpochParams {
  epoch: number;
}

/** 'UpdateCardanoEpoch' return type */
export type IUpdateCardanoEpochResult = void;

/** 'UpdateCardanoEpoch' query type */
export interface IUpdateCardanoEpochQuery {
  params: IUpdateCardanoEpochParams;
  result: IUpdateCardanoEpochResult;
}

const updateCardanoEpochIR: any = {"usedParamSet":{"epoch":true},"params":[{"name":"epoch","required":true,"transform":{"type":"scalar"},"locs":[{"a":72,"b":78},{"a":122,"b":128}]}],"statement":"INSERT INTO cardano_last_epoch(\n    id,\n    epoch\n) VALUES (\n    0,\n    :epoch!\n) \nON CONFLICT (id) DO\nUPDATE SET epoch = :epoch!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cardano_last_epoch(
 *     id,
 *     epoch
 * ) VALUES (
 *     0,
 *     :epoch!
 * ) 
 * ON CONFLICT (id) DO
 * UPDATE SET epoch = :epoch!
 * ```
 */
export const updateCardanoEpoch = new PreparedQuery<IUpdateCardanoEpochParams,IUpdateCardanoEpochResult>(updateCardanoEpochIR);


/** 'GetCardanoEpoch' parameters type */
export type IGetCardanoEpochParams = void;

/** 'GetCardanoEpoch' return type */
export interface IGetCardanoEpochResult {
  epoch: number;
}

/** 'GetCardanoEpoch' query type */
export interface IGetCardanoEpochQuery {
  params: IGetCardanoEpochParams;
  result: IGetCardanoEpochResult;
}

const getCardanoEpochIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT epoch from cardano_last_epoch LIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT epoch from cardano_last_epoch LIMIT 1
 * ```
 */
export const getCardanoEpoch = new PreparedQuery<IGetCardanoEpochParams,IGetCardanoEpochResult>(getCardanoEpochIR);


