/** Types generated for queries found in "src/sql/cde-tracking-cardano.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'MarkCardanoCdeDatumProcessed' parameters type */
export interface IMarkCardanoCdeDatumProcessedParams {
  datum_count?: number | null | void;
  slot: number;
}

/** 'MarkCardanoCdeDatumProcessed' return type */
export type IMarkCardanoCdeDatumProcessedResult = void;

/** 'MarkCardanoCdeDatumProcessed' query type */
export interface IMarkCardanoCdeDatumProcessedQuery {
  params: IMarkCardanoCdeDatumProcessedParams;
  result: IMarkCardanoCdeDatumProcessedResult;
}

const markCardanoCdeDatumProcessedIR: any = {"usedParamSet":{"slot":true,"datum_count":true},"params":[{"name":"slot","required":true,"transform":{"type":"scalar"},"locs":[{"a":66,"b":71}]},{"name":"datum_count","required":false,"transform":{"type":"scalar"},"locs":[{"a":74,"b":85}]}],"statement":"INSERT INTO cde_tracking_cardano(slot, datum_count, done)\nVALUES (:slot!, :datum_count, FALSE)\nON CONFLICT (slot)\nDO UPDATE SET\nslot = EXCLUDED.slot,\ndatum_count = EXCLUDED.datum_count,\ndone = EXCLUDED.done"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_tracking_cardano(slot, datum_count, done)
 * VALUES (:slot!, :datum_count, FALSE)
 * ON CONFLICT (slot)
 * DO UPDATE SET
 * slot = EXCLUDED.slot,
 * datum_count = EXCLUDED.datum_count,
 * done = EXCLUDED.done
 * ```
 */
export const markCardanoCdeDatumProcessed = new PreparedQuery<IMarkCardanoCdeDatumProcessedParams,IMarkCardanoCdeDatumProcessedResult>(markCardanoCdeDatumProcessedIR);


/** 'MarkCardanoCdeBlockheightProcessed' parameters type */
export interface IMarkCardanoCdeBlockheightProcessedParams {
  slot: number;
}

/** 'MarkCardanoCdeBlockheightProcessed' return type */
export type IMarkCardanoCdeBlockheightProcessedResult = void;

/** 'MarkCardanoCdeBlockheightProcessed' query type */
export interface IMarkCardanoCdeBlockheightProcessedQuery {
  params: IMarkCardanoCdeBlockheightProcessedParams;
  result: IMarkCardanoCdeBlockheightProcessedResult;
}

const markCardanoCdeBlockheightProcessedIR: any = {"usedParamSet":{"slot":true},"params":[{"name":"slot","required":true,"transform":{"type":"scalar"},"locs":[{"a":59,"b":64}]}],"statement":"UPDATE cde_tracking_cardano\nSET\n  done = TRUE\nWHERE slot = :slot!"};

/**
 * Query generated from SQL:
 * ```
 * UPDATE cde_tracking_cardano
 * SET
 *   done = TRUE
 * WHERE slot = :slot!
 * ```
 */
export const markCardanoCdeBlockheightProcessed = new PreparedQuery<IMarkCardanoCdeBlockheightProcessedParams,IMarkCardanoCdeBlockheightProcessedResult>(markCardanoCdeBlockheightProcessedIR);


/** 'GetCardanoSpecificCdeBlockheight' parameters type */
export interface IGetCardanoSpecificCdeBlockheightParams {
  slot: number;
}

/** 'GetCardanoSpecificCdeBlockheight' return type */
export interface IGetCardanoSpecificCdeBlockheightResult {
  datum_count: number;
  done: boolean;
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
  datum_count: number;
  done: boolean;
  slot: number;
}

/** 'GetCardanoLatestProcessedCdeBlockheight' query type */
export interface IGetCardanoLatestProcessedCdeBlockheightQuery {
  params: IGetCardanoLatestProcessedCdeBlockheightParams;
  result: IGetCardanoLatestProcessedCdeBlockheightResult;
}

const getCardanoLatestProcessedCdeBlockheightIR: any = {"usedParamSet":{},"params":[],"statement":"SELECT * FROM cde_tracking_cardano\nWHERE done IS TRUE\nORDER BY slot DESC\nLIMIT 1"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM cde_tracking_cardano
 * WHERE done IS TRUE
 * ORDER BY slot DESC
 * LIMIT 1
 * ```
 */
export const getCardanoLatestProcessedCdeBlockheight = new PreparedQuery<IGetCardanoLatestProcessedCdeBlockheightParams,IGetCardanoLatestProcessedCdeBlockheightResult>(getCardanoLatestProcessedCdeBlockheightIR);


