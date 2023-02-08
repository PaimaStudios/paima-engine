/** Types generated for queries found in "src/insert.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'UpsertUser' parameters type */
export interface IUpsertUserParams {
  stats: {
    wallet: string,
    experience: number
  };
}

/** 'UpsertUser' return type */
export type IUpsertUserResult = void;

/** 'UpsertUser' query type */
export interface IUpsertUserQuery {
  params: IUpsertUserParams;
  result: IUpsertUserResult;
}

const upsertUserIR: any = {"usedParamSet":{"stats":true},"params":[{"name":"stats","required":false,"transform":{"type":"pick_tuple","keys":[{"name":"wallet","required":true},{"name":"experience","required":true}]},"locs":[{"a":25,"b":30}]}],"statement":"INSERT INTO users\nVALUES :stats\nON CONFLICT (wallet)\nDO UPDATE SET\nexperience = EXCLUDED.experience"};

/**
 * Query generated from SQL:
 * ```
 * INSERT INTO users
 * VALUES :stats
 * ON CONFLICT (wallet)
 * DO UPDATE SET
 * experience = EXCLUDED.experience
 * ```
 */
export const upsertUser = new PreparedQuery<IUpsertUserParams,IUpsertUserResult>(upsertUserIR);


