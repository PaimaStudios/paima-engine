/* @name getAchievementTypes */
SELECT * FROM achievement_type
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
