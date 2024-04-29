import { Controller, Get, Path, Query, Route } from 'tsoa';
import { EngineService } from '../EngineService.js';
import { ENV } from '@paima/utils';
import type {
  AchievementService,
  AchievementPublicList,
  PlayerAchievements,
  Validity,
} from '@paima/utils-backend';

// ----------------------------------------------------------------------------
// Controller and routes per PRC-1

function service(): AchievementService {
  return EngineService.INSTANCE.achievementService;
}

@Route('achievements')
export class AchievementsController extends Controller {
  private async defaultValidity(): Promise<Validity> {
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
    return {
      ...(await service().getGame()),
      ...(await this.defaultValidity()),
      ...(await service().getValidity()),
      achievements: (await service().getAllAchievements())
        .filter(ach => !category || category === ach.category)
        .filter(ach => !isActive || isActive === ach.isActive),
    };
  }

  @Get('wallet/{wallet}')
  public async wallet(
    @Path() wallet: string,
    /** Comma-separated list. */
    @Query() name?: string
  ): Promise<PlayerAchievements> {
    const player = await service().getPlayer(wallet);
    const achievements = await service().getPlayerAchievements(wallet);
    const nameSet = name ? new Set(name.split(',')) : null;
    return {
      ...(await this.defaultValidity()),
      ...(await service().getValidity()),
      ...player,
      completed: achievements.reduce((n, ach) => n + (ach.completed ? 1 : 0), 0),
      achievements: nameSet ? achievements.filter(ach => nameSet.has(ach.name)) : achievements,
    };
  }

  @Get('nft/{nft_address}')
  public async nft(
    @Path() nft_address: string,
    /** Comma-separated list. */
    @Query() name?: string
  ): Promise<PlayerAchievements> {
    const wallet = await service().getNftOwner(nft_address);
    return await this.wallet(wallet, name);
  }
}
