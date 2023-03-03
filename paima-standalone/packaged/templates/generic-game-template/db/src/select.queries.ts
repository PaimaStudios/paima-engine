/** Types generated for queries found in "src/select.sql" */
import { PreparedQuery } from '@pgtyped/query';

/** 'GetUser' parameters type */
export interface IGetUserParams {
  wallet: string | null | void;
}

/** 'GetUser' return type */
export interface IGetUserResult {
  experience: number;
  wallet: string;
}

/** 'GetUser' query type */
export interface IGetUserQuery {
  params: IGetUserParams;
  result: IGetUserResult;
}

const getUserIR: any = {"usedParamSet":{"wallet":true},"params":[{"name":"wallet","required":false,"transform":{"type":"scalar"},"locs":[{"a":41,"b":47}]}],"statement":"SELECT * FROM users\nWHERE users.wallet = :wallet"};

/**
 * Query generated from SQL:
 * ```
 * SELECT * FROM users
 * WHERE users.wallet = :wallet
 * ```
 */
export const getUser = new PreparedQuery<IGetUserParams,IGetUserResult>(getUserIR);


