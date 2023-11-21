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

const markCardanoCdeSlotProcessedIR: any = {"usedParamSet":{"slot":true},"params":[{"name":"slot","required":true,"transform":{"type":"scalar"},"locs":[{"a":47,"b":52}]}],"statement":"INSERT INTO cde_tracking(block_height)\nVALUES (:slot!)"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_tracking(block_height)
 * VALUES (:slot!)
 * ```
 */
export const markCardanoCdeSlotProcessed = new PreparedQuery<IMarkCardanoCdeSlotProcessedParams,IMarkCardanoCdeSlotProcessedResult>(markCardanoCdeSlotProcessedIR);


/** 'GetCardanoSpecificCdeBlockheight' parameters type */
export interface IGetCardanoSpecificCdeBlockheightParams {
  slot: number;
}

/** 'GetCardanoSpecificCdeBlockheight' return type */
export interface IGetCardanoSpecificCdeBlockheightResult {
  slot: number;
}

/** 'GetCardanoSpecificCdeBlockheight' query type */
export interface IGetCardanoSpecificCdeBlockheightQuery {
  params: IGetCardanoSpecificCdeBlockheightParams;
  result: IGetCardanoSpecificCdeBlockheightResult;
}

const getCardanoSpecificCdeBlockheightIR: any = {"usedParamSet":{"slot":true},"params":[{"name":"slot","required":true,"transform":{"type":"scalar"},"locs":[{"a":48,"b":53}]}],"statement":"SELECT * FROM cde_tracking_cardano\nWHERE slot = :slot!"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_tracking_cardano
 * WHERE slot = :slot!
 * ```
 */
export const getCardanoSpecificCdeBlockheight = new PreparedQuery<IGetCardanoSpecificCdeBlockheightParams,IGetCardanoSpecificCdeBlockheightResult>(getCardanoSpecificCdeBlockheightIR);


/** 'GetCardanoLatestProcessedCdeBlockheight' parameters type */
export type IGetCardanoLatestProcessedCdeBlockheightParams = void;

/** 'GetCardanoLatestProcessedCdeBlockheight' return type */
export interface IGetCardanoLatestProcessedCdeBlockheightResult {
  slot: number;
}

/** 'GetCardanoLatestProcessedCdeBlockheight' query type */
export interface IGetCardanoLatestProcessedCdeBlockheightQuery {
  params: IGetCardanoLatestProcessedCdeBlockheightParams;
  result: IGetCardanoLatestProcessedCdeBlockheightResult;
}

const getCardanoLatestProcessedCdeBlockheightIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM cde_tracking_cardano\nORDER BY slot DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_tracking_cardano
 * ORDER BY slot DESC
 * LIMIT 1
 * ```
 */
export const getCardanoLatestProcessedCdeBlockheight = new PreparedQuery<IGetCardanoLatestProcessedCdeBlockheightParams,IGetCardanoLatestProcessedCdeBlockheightResult>(getCardanoLatestProcessedCdeBlockheightIR);


