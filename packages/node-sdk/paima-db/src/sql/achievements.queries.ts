/** Types generated for queries found in "src/sql/achievements.sql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type stringArray = (string)[];

/** 'GetAchievementTypes' parameters type */
export interface IGetAchievementTypesParams {
  category?: string | null | void;
  is_active?: boolean | null | void;
  languages?: stringArray | null | void;
}

/** 'GetAchievementTypes' return type */
export interface IGetAchievementTypesResult {
  description: string | null;
  display_name: string | null;
  is_active: boolean;
  metadata: Json;
  name: string;
}

/** 'GetAchievementTypes' query type */
export interface IGetAchievementTypesQuery {
  params: IGetAchievementTypesParams;
  result: IGetAchievementTypesResult;
}

const getAchievementTypesIR: any = {"usedParamSet":{"languages":true,"is_active":true,"category":true},"params":[{"name":"languages","required":false,"transform":{"type":"scalar"},"locs":[{"a":355,"b":364},{"a":429,"b":438}]},{"name":"is_active","required":false,"transform":{"type":"scalar"},"locs":[{"a":508,"b":517},{"a":539,"b":548}]},{"name":"category","required":false,"transform":{"type":"scalar"},"locs":[{"a":568,"b":576},{"a":595,"b":603}]}],"statement":"SELECT\n  achievement_type.name,\n  achievement_type.is_active,\n  coalesce(sub.display_name, achievement_type.display_name) AS display_name,\n  coalesce(sub.description, achievement_type.description) AS description,\n  achievement_type.metadata\nFROM achievement_type\nLEFT JOIN (\n  SELECT DISTINCT ON(name) *\n  FROM achievement_language\n  WHERE array_position(:languages::text[], language) IS NOT NULL\n  ORDER BY name, array_position(:languages::text[], language)\n) sub ON achievement_type.name = sub.name\nWHERE (:is_active::BOOLEAN IS NULL OR :is_active = is_active)\nAND (:category::TEXT IS NULL OR :category = metadata ->> 'category')"};

/**
 * Query generated from SQL:
 * ```sql
 * SELECT
 *   achievement_type.name,
 *   achievement_type.is_active,
 *   coalesce(sub.display_name, achievement_type.display_name) AS display_name,
 *   coalesce(sub.description, achievement_type.description) AS description,
 *   achievement_type.metadata
 * FROM achievement_type
 * LEFT JOIN (
 *   SELECT DISTINCT ON(name) *
 *   FROM achievement_language
 *   WHERE array_position(:languages::text[], language) IS NOT NULL
 *   ORDER BY name, array_position(:languages::text[], language)
 * ) sub ON achievement_type.name = sub.name
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


