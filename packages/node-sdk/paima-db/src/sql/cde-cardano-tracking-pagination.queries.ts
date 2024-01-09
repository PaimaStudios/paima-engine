/** Types generated for queries found in "src/sql/cde-cardano-tracking-pagination.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetCarpCursors' parameters type */
export type IGetCarpCursorsParams = void;

/** 'GetCarpCursors' return type */
export interface IGetCarpCursorsResult {
  cde_id: number;
  cursor: string;
  finished: boolean;
}

/** 'GetCarpCursors' query type */
export interface IGetCarpCursorsQuery {
  params: IGetCarpCursorsParams;
  result: IGetCarpCursorsResult;
}

const getCarpCursorsIR: any = {"usedParamSet":{},"params":[],"statement":"select * from cde_tracking_cardano_pagination"};

/**
 * Query generated from SQL:
 * ```
 * select * from cde_tracking_cardano_pagination
 * ```
 */
export const getCarpCursors = new PreparedQuery<IGetCarpCursorsParams,IGetCarpCursorsResult>(getCarpCursorsIR);


/** 'UpdateCardanoPaginationCursor' parameters type */
export interface IUpdateCardanoPaginationCursorParams {
  cde_id: number;
  cursor: string;
  finished: boolean;
}

/** 'UpdateCardanoPaginationCursor' return type */
export type IUpdateCardanoPaginationCursorResult = void;

/** 'UpdateCardanoPaginationCursor' query type */
export interface IUpdateCardanoPaginationCursorQuery {
  params: IUpdateCardanoPaginationCursorParams;
  result: IUpdateCardanoPaginationCursorResult;
}

const updateCardanoPaginationCursorIR: any = {"usedParamSet":{"cde_id":true,"cursor":true,"finished":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":89,"b":96}]},{"name":"cursor","required":true,"transform":{"type":"scalar"},"locs":[{"a":101,"b":108},{"a":170,"b":177}]},{"name":"finished","required":true,"transform":{"type":"scalar"},"locs":[{"a":113,"b":122},{"a":191,"b":200}]}],"statement":"INSERT INTO cde_tracking_cardano_pagination(\n  cde_id,\n  cursor,\n  finished\n) VALUES (\n  :cde_id!,\n  :cursor!,\n  :finished!\n)\nON CONFLICT (cde_id)\nDO UPDATE SET cursor = :cursor!, finished = :finished!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_tracking_cardano_pagination(
 *   cde_id,
 *   cursor,
 *   finished
 * ) VALUES (
 *   :cde_id!,
 *   :cursor!,
 *   :finished!
 * )
 * ON CONFLICT (cde_id)
 * DO UPDATE SET cursor = :cursor!, finished = :finished!
 * ```
 */
export const updateCardanoPaginationCursor = new PreparedQuery<IUpdateCardanoPaginationCursorParams,IUpdateCardanoPaginationCursorResult>(updateCardanoPaginationCursorIR);


