import { backendQueryUser } from '../helpers/query-constructors';
import { Result, UserState } from '../types';

async function getUserState(wallet: string): Promise<Result<UserState>> {
  const query = backendQueryUser(wallet);
  const response = await fetch(query);

  const j = (await response.json()) as UserState;
  return {
    success: true,
    result: {
      experience: j.experience,
      wallet: j.wallet,
    },
  };
}

export const queryEndpoints = {
  getUserState,
};
