import type { PreparedQuery } from '@pgtyped/query';

export type SQLUpdate = [PreparedQuery<any, any>, any];
