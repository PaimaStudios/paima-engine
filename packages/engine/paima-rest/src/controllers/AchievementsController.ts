import { getAchievementProgress, getMainAddress } from '@paima/db';
import { ENV } from '@paima/utils';
import type { FailedResult, InternalServerErrorResult, ValidateErrorResult } from '@paima/utils';
import {
  getNftOwner,
  type Achievement,
  type AchievementMetadata,
  type AchievementPublicList,
  type Player,
  type PlayerAchievements,
  type Validity,
} from '@paima/utils-backend';
import { Controller, Get, Header, Path, Query, Response, Route } from 'tsoa';
import { EngineService } from '../EngineService.js';
import { StatusCodes } from 'http-status-codes';

// Note: if you ever get `No declarations found for referenced type` in this folder, try running `npx nx reset`

// ----------------------------------------------------------------------------
// Controller and routes per PRC-1

function applyLanguage(
  achievement: Achievement,
  languages: AchievementMetadata['languages'],
  accept: string[]
): Achievement {
  for (const acceptLang of accept) {
    const override = languages?.[acceptLang]?.[achievement.name];
    if (override) {
      return {
        ...achievement,
        displayName: override.displayName || achievement.displayName,
        description: override.description || achievement.description,
      };
    }
  }
  return achievement;
}

@Route('achievements')
export class AchievementsController extends Controller {
  private async meta(): Promise<AchievementMetadata> {
    const meta = EngineService.INSTANCE.achievements;
    if (!meta) {
      this.setStatus(StatusCodes.NOT_IMPLEMENTED);
      throw new Error('Achievements are not supported by this game');
    }
    return await meta;
  }

  private async validity(): Promise<Validity> {
    return {
      // TODO: will need updating when we support non-EVM data availability layers.
      caip2: `eip155:${ENV.CHAIN_ID}`,
      block: await EngineService.INSTANCE.getSM().latestProcessedBlockHeight(),
      time: new Date().toISOString(),
    };
  }

  @Response<FailedResult>(StatusCodes.NOT_IMPLEMENTED)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
  @Get('public/list')
  public async public_list(
    @Query() category?: string,
    @Query() isActive?: boolean,
    @Header('Accept-Language') acceptLanguage?: string
  ): Promise<AchievementPublicList> {
    // Future expansion: import a real Accept-Language parser so user can
    // ask for more than one, handle 'pt-BR' also implying 'pt', etc.
    const acceptLanguages = acceptLanguage ? [acceptLanguage] : [];

    const meta = await this.meta();
    const filtered = meta.list
      .filter(ach => category === undefined || category === ach.category)
      .filter(ach => isActive === undefined || isActive === ach.isActive);

    this.setHeader('Content-Language', acceptLanguages[0]);
    return {
      ...(await this.validity()),
      ...meta.game,
      achievements: meta.languages
        ? filtered.map(ach => applyLanguage(ach, meta.languages, acceptLanguages))
        : filtered,
    };
  }

  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
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
      // walletType and userName aren't fulfilled here because Paima Engine's
      // own DB tables don't include them at the moment.
    };

    const names = name ? name.split(',') : ['*'];
    const rows = await getAchievementProgress.run({ wallet: id, names }, db);

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

  @Response<FailedResult>(StatusCodes.NOT_FOUND)
  @Response<FailedResult>(StatusCodes.NOT_IMPLEMENTED)
  @Response<InternalServerErrorResult>(StatusCodes.INTERNAL_SERVER_ERROR)
  @Response<ValidateErrorResult>(StatusCodes.UNPROCESSABLE_ENTITY)
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
          // Future improvement: throw a different error if no CDE with that name exists
          this.setStatus(StatusCodes.NOT_FOUND);
          throw new Error('No owner for that NFT');
        }
      // Future improvement: erc6551
      default:
        this.setStatus(StatusCodes.NOT_IMPLEMENTED);
        throw new Error(`No support for /erc/${erc}`);
    }
  }
}
