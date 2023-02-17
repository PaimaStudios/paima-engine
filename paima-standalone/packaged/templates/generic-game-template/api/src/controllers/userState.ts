import { Controller, Get, Query, Route } from 'tsoa';
import type { IGetUserResult } from '@game/db';
import { getUser, requirePool } from '@game/db';

@Route('user_state')
export class UserStateController extends Controller {
  @Get()
  public async get(@Query() wallet: string): Promise<IGetUserResult> {
    const pool = requirePool();
    wallet = wallet.toLowerCase();
    const [stats] = await getUser.run({ wallet }, pool);
    if (!stats) {
      return {
        experience: 0,
        wallet,
      };
    }
    return stats;
  }
}
