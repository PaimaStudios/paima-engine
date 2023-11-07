import type { PreparedQuery } from '@pgtyped/runtime';

export type SQLUpdate = [PreparedQuery<any, any>, any];
