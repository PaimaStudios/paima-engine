/* @name getPaginationCursors */
select * from cde_tracking_cursor_pagination;

/* @name updatePaginationCursor */
INSERT INTO cde_tracking_cursor_pagination(
  cde_name,
  cursor,
  finished
) VALUES (
  :cde_name!,
  :cursor!,
  :finished!
)
ON CONFLICT (cde_name)
DO UPDATE SET cursor = :cursor!, finished = :finished!;