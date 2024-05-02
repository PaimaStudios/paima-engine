/*
  @name getAchievementProgress
  @param names -> (...)
*/
SELECT * FROM achievement_progress
WHERE wallet = :wallet!
AND ('*' in :names OR name IN :names)
;
