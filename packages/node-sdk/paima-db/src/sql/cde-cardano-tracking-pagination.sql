/* @name getCarpCursors */
select * from cde_tracking_cardano_pagination;

/* @name updateCardanoPaginationCursor */
INSERT INTO cde_tracking_cardano_pagination(
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