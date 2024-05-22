/** Types generated for queries found in "src/sql/cde-cursor-tracking-pagination.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetPaginationCursors' parameters type */
export type IGetPaginationCursorsParams = void;

/** 'GetPaginationCursors' return type */
export interface IGetPaginationCursorsResult {
  cde_name: string;
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
  cde_name: string;
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

const updatePaginationCursorIR: any = {"usedParamSet":{"cde_name":true,"cursor":true,"finished":true},"params":[{"name":"cde_name","required":true,"transform":{"type":"scalar"},"locs":[{"a":90,"b":99}]},{"name":"cursor","required":true,"transform":{"type":"scalar"},"locs":[{"a":104,"b":111},{"a":175,"b":182}]},{"name":"finished","required":true,"transform":{"type":"scalar"},"locs":[{"a":116,"b":125},{"a":196,"b":205}]}],"statement":"INSERT INTO cde_tracking_cursor_pagination(\n  cde_name,\n  cursor,\n  finished\n) VALUES (\n  :cde_name!,\n  :cursor!,\n  :finished!\n)\nON CONFLICT (cde_name)\nDO UPDATE SET cursor = :cursor!, finished = :finished!"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO cde_tracking_cursor_pagination(
 *   cde_name,
 *   cursor,
 *   finished
 * ) VALUES (
 *   :cde_name!,
 *   :cursor!,
 *   :finished!
 * )
 * ON CONFLICT (cde_name)
 * DO UPDATE SET cursor = :cursor!, finished = :finished!
 * ```
 */
export const updatePaginationCursor = new PreparedQuery<IUpdatePaginationCursorParams,IUpdatePaginationCursorResult>(updatePaginationCursorIR);


