/** Types generated for queries found in "src/sql/cde-cursor-tracking-pagination.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetPaginationCursors' parameters type */
export type IGetPaginationCursorsParams = void;

/** 'GetPaginationCursors' return type */
export interface IGetPaginationCursorsResult {
  cde_id: number;
  cursor: string;
  finished: boolean;
}

/** 'GetPaginationCursors' query type */
export interface IGetPaginationCursorsQuery {
  params: IGetPaginationCursorsParams;
  result: IGetPaginationCursorsResult;
}

const getPaginationCursorsIR: any = {"usedParamSet":{},"params":[],"statement":"select * from cde_tracking_cursor_pagination"};

/**
 * Query generated from SQL:
 * ```
 * select * from cde_tracking_cursor_pagination
 * ```
 */
export const getPaginationCursors = new PreparedQuery<IGetPaginationCursorsParams,IGetPaginationCursorsResult>(getPaginationCursorsIR);


/** 'UpdatePaginationCursor' parameters type */
export interface IUpdatePaginationCursorParams {
  cde_id: number;
  cursor: string;
  finished: boolean;
}

/** 'UpdatePaginationCursor' return type */
export type IUpdatePaginationCursorResult = void;

/** 'UpdatePaginationCursor' query type */
export interface IUpdatePaginationCursorQuery {
  params: IUpdatePaginationCursorParams;
  result: IUpdatePaginationCursorResult;
}

const updatePaginationCursorIR: any = {"usedParamSet":{"cde_id":true,"cursor":true,"finished":true},"params":[{"name":"cde_id","required":true,"transform":{"type":"scalar"},"locs":[{"a":88,"b":95}]},{"name":"cursor","required":true,"transform":{"type":"scalar"},"locs":[{"a":100,"b":107},{"a":169,"b":176}]},{"name":"finished","required":true,"transform":{"type":"scalar"},"locs":[{"a":112,"b":121},{"a":190,"b":199}]}],"statement":"INSERT INTO cde_tracking_cursor_pagination(\n  cde_id,\n  cursor,\n  finished\n) VALUES (\n  :cde_id!,\n  :cursor!,\n  :finished!\n)\nON CONFLICT (cde_id)\nDO UPDATE SET cursor = :cursor!, finished = :finished!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_tracking_cursor_pagination(
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
export const updatePaginationCursor = new PreparedQuery<IUpdatePaginationCursorParams,IUpdatePaginationCursorResult>(updatePaginationCursorIR);


