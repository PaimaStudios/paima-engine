import { Controller, Get, Path, Query, Route } from 'tsoa';
import { EngineService } from '../EngineService.js';
import { ENV } from '@paima/utils';
import type {
  AchievementPublicList,
  PlayerAchievements,
  Validity,
  Game,
  Player,
} from '@paima/utils-backend';
import { getAchievementTypes, getAchievementProgress } from '@paima/db';

// ----------------------------------------------------------------------------
// Controller and routes per PRC-1

@Route('achievements')
export class AchievementsController extends Controller {
  private async game(): Promise<Game> {
    return { id: 'DERP' };
  }

  private async validity(): Promise<Validity> {
    return {
      chainId: ENV.CHAIN_ID,
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

  /* TODO
  @Get('nft/{nft_address}')
  public async nft(
    @Path() nft_address: string,
    Comma-separated list.
    @Query() name?: string
  ): Promise<PlayerAchievements> {
    const wallet = await service().getNftOwner(nft_address);
    return await this.wallet(wallet, name);
  }
  */
}
