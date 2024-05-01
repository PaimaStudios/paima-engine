import { Controller, Get, Header, Path, Query, Route } from 'tsoa';
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
import { getAchievementTypes, getAchievementProgress, getMainAddress } from '@paima/db';

// ----------------------------------------------------------------------------
// Controller and routes per PRC-1

@Route('achievements')
export class AchievementsController extends Controller {
  private async game(): Promise<Game> {
    return {
      id: 'TODO',
      // TODO: name, version
    };
  }

  private async validity(): Promise<Validity> {
    return {
      caip2: `eip155:${ENV.CHAIN_ID}`,
      block: await EngineService.INSTANCE.getSM().latestProcessedBlockHeight(),
      time: new Date().toISOString(),
    };
  }

  @Get('public/list')
  public async public_list(
    @Query() category?: string,
    @Query() isActive?: boolean,
    @Header('Accept-Language') acceptLanguage?: string
  ): Promise<AchievementPublicList> {
    const db = EngineService.INSTANCE.getSM().getReadonlyDbConn();
    // Future expansion: import a real Accept-Language parser so user can provide more than one, handle 'pt-BR' also implying 'pt', etc.
    const languages = acceptLanguage ? [acceptLanguage] : [];
    const rows = await getAchievementTypes.run({ category, is_active: isActive, languages }, db);

    this.setHeader('Content-Language', languages[0]);
    return {
      ...(await this.validity()),
      ...(await this.game()),
      achievements: rows.map(row => ({
        ...(typeof row.metadata === 'object' ? row.metadata : {}),
        // Splat metadata first so that it can't override these:
        name: row.name,
        isActive: row.is_active,
        displayName: row.display_name ?? '',
        description: row.description ?? '',
      })),
    };
  }

  @Get('wallet/{wallet}')
  public async wallet(
    @Path() wallet: string,
    /** Comma-separated list. */
    @Query() name?: string
  ): Promise<PlayerAchievements> {
    const db = EngineService.INSTANCE.getSM().getReadonlyDbConn();
    const { address, id } = await getMainAddress(wallet, db);

    const player: Player = {
      wallet: address,
      userId: String(id),
      // TODO: walletType, userName
    };

    const names = name ? name.split(',') : ['*'];
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

  @Get('erc/{erc}/{cde}/{token_id}')
  public async nft(
    @Path() erc: string,
    @Path() cde: string,
    @Path() token_id: string,
    @Query() name?: string
  ): Promise<PlayerAchievements> {
    const db = EngineService.INSTANCE.getSM().getReadonlyDbConn();

    switch (erc) {
      case 'erc721':
        const wallet = await getNftOwner(db, cde, BigInt(token_id));
        if (wallet) {
          return await this.wallet(wallet, name);
        } else {
          // TODO: throw a different error if no CDE with that name exists
          this.setStatus(404);
          throw new Error('No owner for that NFT');
        }
      // Future expansion: erc6551
      default:
        this.setStatus(404);
        throw new Error(`No support for /erc/${erc}`);
    }
  }
}
