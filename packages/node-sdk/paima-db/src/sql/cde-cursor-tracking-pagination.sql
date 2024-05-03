/* @name getPaginationCursors */
select * from cde_tracking_cursor_pagination;

/* @name updatePaginationCursor */
INSERT INTO cde_tracking_cursor_pagination(
  cde_id,
  cursor,
  finished
) VALUES (
  :cde_id!,
  :cursor!,
  :finished!
)
ON CONFLICT (cde_id)
DO UPDATE SET cursor = :cursor!, finished = :finished!;