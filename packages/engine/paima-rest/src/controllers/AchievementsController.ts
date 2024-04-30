import { Controller, Get, Path, Query, Route } from 'tsoa';
import { EngineService } from '../EngineService.js';
import { ENV } from '@paima/utils';
import {
  type AchievementPublicList,
  type PlayerAchievements,
  type Validity,
  type Game,
  type Player,
  getNftOwner,
} from '@paima/utils-backend';
import { getAchievementTypes, getAchievementProgress } from '@paima/db';

// ----------------------------------------------------------------------------
// Controller and routes per PRC-1

@Route('achievements')
export class AchievementsController extends Controller {
  private async game(): Promise<Game> {
    return { id: 'TODO' };
  }

  private async validity(): Promise<Validity> {
    return {
      caip2: ENV.CHAIN_ID,
      block: await EngineService.INSTANCE.getSM().latestProcessedBlockHeight(),
      time: new Date().toISOString(),
    };
  }

  @Get('public/list')
  public async public_list(
    @Query() category?: string,
    @Query() isActive?: boolean
  ): Promise<AchievementPublicList> {
    const db = EngineService.INSTANCE.getSM().getReadonlyDbConn();
    const rows = await getAchievementTypes.run({ category, is_active: isActive }, db);

    this.setHeader('Content-Language', 'en');
    return {
      ...(await this.validity()),
      ...(await this.game()),
      achievements: rows.map(row => ({
        ...(typeof row.metadata === 'object' ? row.metadata : {}),
        // Splat metadata first so that it can't override these:
        name: row.name,
        isActive: row.is_active,
        displayName: row.display_name,
        description: row.description,
      })),
    };
  }

  @Get('wallet/{wallet}')
  public async wallet(
    @Path() wallet: string,
    /** Comma-separated list. */
    @Query() name?: string
  ): Promise<PlayerAchievements> {
    const names = name ? name.split(',') : [];
    const player: Player = { wallet };

    const db = EngineService.INSTANCE.getSM().getReadonlyDbConn();
    const rows = await getAchievementProgress.run({ wallet, names }, db);

    this.setHeader('Content-Language', 'en');
    return {
      ...(await this.validity()),
      ...player,
      completed: rows.reduce((n, row) => n + (row.completed_date ? 1 : 0), 0),
      achievements: rows.map(row => ({
        name: row.name,
        completed: Boolean(row.completed_date),
        completedDate: row.completed_date ?? undefined,
        completedRate: row.total
          ? {
              progress: row.progress ?? 0,
              total: row.total,
            }
          : undefined,
      })),
    };
  }

  @Get('erc/{erc}/{cde}/{token_id}')
  public async nft(
    @Path() erc: string,
    @Path() cde: string,
    @Path() token_id: string,
    @Query() name?: string
  ): Promise<PlayerAchievements> {
    const db = EngineService.INSTANCE.getSM().getReadonlyDbConn();
    this.setHeader('Content-Language', 'en');

    switch (erc) {
      case 'erc721':
        const wallet = await getNftOwner(db, cde, BigInt(token_id));
        if (wallet) {
          return await this.wallet(wallet, name);
        }
        break;
      case 'erc6551':
        // TODO
        break;
    }

    this.setStatus(404);
    throw new Error('Not found');
  }
}
