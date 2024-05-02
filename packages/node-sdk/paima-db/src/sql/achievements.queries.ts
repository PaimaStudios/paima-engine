/** Types generated for queries found in "src/sql/achievements.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

/** 'GetAchievementProgress' parameters type */
export interface IGetAchievementProgressParams {
  names: readonly (string | null | void)[];
  wallet: string;
}

/** 'GetAchievementProgress' return type */
export interface IGetAchievementProgressResult {
  completed_date: Date | null;
  name: string;
  progress: number | null;
  total: number | null;
  wallet: string;
}

/** 'GetAchievementProgress' query type */
export interface IGetAchievementProgressQuery {
  params: IGetAchievementProgressParams;
  result: IGetAchievementProgressResult;
}

const getAchievementProgressIR: any = {"usedParamSet":{"wallet":true,"names":true},"params":[{"name":"names","required":false,"transform":{"type":"array_spread"},"locs":[{"a":71,"b":76},{"a":89,"b":94}]},{"name":"wallet","required":true,"transform":{"type":"scalar"},"locs":[{"a":50,"b":57}]}],"statement":"SELECT * FROM achievement_progress\nWHERE wallet = :wallet!\nAND ('*' in :names OR name IN :names)"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM achievement_progress
 * WHERE wallet = :wallet!
 * AND ('*' in :names OR name IN :names)
 * ```
 */
export const getAchievementProgress = new PreparedQuery<IGetAchievementProgressParams,IGetAchievementProgressResult>(getAchievementProgressIR);


