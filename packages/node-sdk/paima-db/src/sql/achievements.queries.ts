/** Types generated for queries found in "src/sql/achievements.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

/** 'GetAchievementTypes' parameters type */
export interface IGetAchievementTypesParams {
  category?: string | null | void;
  is_active?: boolean | null | void;
}

/** 'GetAchievementTypes' return type */
export interface IGetAchievementTypesResult {
  description: string;
  display_name: string;
  is_active: boolean;
  metadata: Json;
  name: string;
}

/** 'GetAchievementTypes' query type */
export interface IGetAchievementTypesQuery {
  params: IGetAchievementTypesParams;
  result: IGetAchievementTypesResult;
}

const getAchievementTypesIR: any = {"usedParamSet":{"is_active":true,"category":true},"params":[{"name":"is_active","required":false,"transform":{"type":"scalar"},"locs":[{"a":38,"b":47},{"a":69,"b":78}]},{"name":"category","required":false,"transform":{"type":"scalar"},"locs":[{"a":98,"b":106},{"a":125,"b":133}]}],"statement":"SELECT * FROM achievement_type\nWHERE (:is_active::BOOLEAN IS NULL OR :is_active = is_active)\nAND (:category::TEXT IS NULL OR :category = metadata ->> 'category')"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM achievement_type
 * WHERE (:is_active::BOOLEAN IS NULL OR :is_active = is_active)
 * AND (:category::TEXT IS NULL OR :category = metadata ->> 'category')
 * ```
 */
export const getAchievementTypes = new PreparedQuery<IGetAchievementTypesParams,IGetAchievementTypesResult>(getAchievementTypesIR);


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


