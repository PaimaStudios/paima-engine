/** Types generated for queries found in "src/sql/cde-tracking-cardano.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'MarkCardanoCdeSlotProcessed' parameters type */
export interface IMarkCardanoCdeSlotProcessedParams {
  slot: number;
}

/** 'MarkCardanoCdeSlotProcessed' return type */
export type IMarkCardanoCdeSlotProcessedResult = void;

/** 'MarkCardanoCdeSlotProcessed' query type */
export interface IMarkCardanoCdeSlotProcessedQuery {
  params: IMarkCardanoCdeSlotProcessedParams;
  result: IMarkCardanoCdeSlotProcessedResult;
}

const markCardanoCdeSlotProcessedIR: any = {"usedParamSet":{"slot":true},"params":[{"name":"slot","required":true,"transform":{"type":"scalar"},"locs":[{"a":53,"b":58},{"a":100,"b":105}]}],"statement":"INSERT INTO cde_tracking_cardano(id,slot)\nVALUES (0, :slot!)\nON CONFLICT (id) \nDO UPDATE SET slot = :slot!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_tracking_cardano(id,slot)
 * VALUES (0, :slot!)
 * ON CONFLICT (id)
 * DO UPDATE SET slot = :slot!
 * ```
 */
export const markCardanoCdeSlotProcessed = new PreparedQuery<IMarkCardanoCdeSlotProcessedParams,IMarkCardanoCdeSlotProcessedResult>(markCardanoCdeSlotProcessedIR);


/** 'GetCardanoLatestProcessedCdeSlot' parameters type */
export type IGetCardanoLatestProcessedCdeSlotParams = void;

/** 'GetCardanoLatestProcessedCdeSlot' return type */
export interface IGetCardanoLatestProcessedCdeSlotResult {
  slot: number | null;
}

/** 'GetCardanoLatestProcessedCdeSlot' query type */
export interface IGetCardanoLatestProcessedCdeSlotQuery {
  params: IGetCardanoLatestProcessedCdeSlotParams;
  result: IGetCardanoLatestProcessedCdeSlotResult;
}

const getCardanoLatestProcessedCdeSlotIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT slot FROM cde_tracking_cardano LIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT slot FROM cde_tracking_cardano LIMIT 1
 * ```
 */
export const getCardanoLatestProcessedCdeSlot = new PreparedQuery<IGetCardanoLatestProcessedCdeSlotParams,IGetCardanoLatestProcessedCdeSlotResult>(getCardanoLatestProcessedCdeSlotIR);


