/* @name getAchievementTypes */
SELECT
  achievement_type.name,
  achievement_type.is_active,
  coalesce(sub.display_name, achievement_type.display_name) AS display_name,
  coalesce(sub.description, achievement_type.description) AS description,
  achievement_type.metadata
FROM achievement_type
LEFT JOIN (
  SELECT DISTINCT ON(name) *
  FROM achievement_language
  WHERE array_position(:languages::text[], language) IS NOT NULL
  ORDER BY name, array_position(:languages::text[], language)
) sub ON achievement_type.name = sub.name
WHERE (:is_active::BOOLEAN IS NULL OR :is_active = is_active)
AND (:category::TEXT IS NULL OR :category = metadata ->> 'category')
;

/*
  @name getAchievementProgress
  @param names -> (...)
*/
SELECT * FROM achievement_progress
WHERE wallet = :wallet!
AND ('*' in :names OR name IN :names)
;
