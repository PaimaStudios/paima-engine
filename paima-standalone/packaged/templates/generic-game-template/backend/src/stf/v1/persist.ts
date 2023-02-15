import type { SQLUpdate } from 'paima-sdk/paima-utils';
import type { IGetUserResult, IUpsertUserParams } from '@game/db';
import { upsertUser } from '@game/db';
import { calculateProgress } from '@game/game-logic';

// this file deals with receiving blockchain data input and outputting SQL updates (imported from pgTyped output of our SQL files)
// PGTyped SQL updates are a tuple of the function calling the database and the params sent to it.

export function persistUserUpdate(
  wallet: string,
  gainedXP: number,
  user: IGetUserResult
): SQLUpdate {
  const userParams: IUpsertUserParams = {
    stats: {
      wallet: wallet.toLowerCase(),
      experience: calculateProgress(user.experience, gainedXP),
    },
  };
  return [upsertUser, userParams];
}
