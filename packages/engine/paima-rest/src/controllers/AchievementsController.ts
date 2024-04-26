import { Controller, Get, Path, Query, Route } from 'tsoa';
import { EngineService } from '../EngineService';
import { ENV } from '@paima/utils';

// ----------------------------------------------------------------------------
// PRC-1 definitions

/** General game info */
export interface Game {
  /** Game ID */
  id: string;
  /** Optional game name */
  name?: string;
  /** Optional game version */
  version?: string;
}

/** Data validity */
export interface Validity {
  /** Data block height (0 always valid) */
  block: number;
  /** Data chain ID */
  chainId: number;
  /** Optional date. ISO8601, like YYYY-MM-DDTHH:mm:ss.sssZ */
  time?: string;
}

/** Player info */
export interface Player {
  /** e.g. addr1234... or 0x1234... */
  wallet: string;
  /** Optional wallet-type */
  walletType?: 'cardano' | 'evm' | 'polkadot' | 'algorand' | string;
  /** If data for specific user: e.g., "1", "player-1", "unique-name", etc. */
  userId?: string;
  /** Player display name */
  userName?: string;
}

export interface Achievement {
  /** Unique Achievement String */
  name: string;
  /** Optional: Relative Value of the Achievement */
  score?: number;
  /** Optional: 'Gold' | 'Diamond' | 'Beginner' | 'Advanced' | 'Vendor' */
  category?: string;
  /** Percent of players that have unlocked the achievement */
  percentCompleted?: number;
  /** If achievement can be unlocked at the time. */
  isActive: boolean;
  /** Achievement Display Name */
  displayName: string;
  /** Achievement Description */
  description: string;
  /** Hide entire achievement or description if not completed */
  spoiler?: 'all' | 'description';
  /** Optional Icon for Achievement */
  iconURI?: string;
  /** Optional Icon for locked Achievement */
  iconGreyURI?: string;
  /** Optional Date ISO8601 YYYY-MM-DDTHH:mm:ss.sssZ */
  startDate?: string;
  /** Optional Date ISO8601 YYYY-MM-DDTHH:mm:ss.sssZ */
  endDate?: string;
}

/** Result of "Get All Available Achievements" */
export interface AchievementPublicList extends Game, Validity {
  achievements: Achievement[];
}

export interface PlayerAchievement {
  /** Unique Achievement String */
  name: string;
  /** Is Achievement completed */
  completed: boolean;
  /** Completed Date ISO8601 YYYY-MM-DDTHH:mm:ss.sssZ */
  completedDate?: Date;
  /** If achievement has incremental progress */
  completedRate?: {
    /** Current Progress */
    progress: number;
    /** Total Progress */
    total: number;
  };
}

/** Result of "Get Completed Achievements" */
export interface PlayerAchievements extends Validity, Player {
  /** Total number of completed achievements for the game */
  completed: number;
  achievements: PlayerAchievement[];
}

// ----------------------------------------------------------------------------
// Extension interface

/**
 * To implement the PRC-1 `/achievements` API, extend this class and set
 * {@link achievementService} to your instance. At minimum you must override
 * {@link getGame} for the API to function, and {@link getAllAchievements} to
 * return a non-empty list for it to be useful.
 */
class AchievementService {
  async getValidity(): Promise<Validity> {
    return {
      chainId: ENV.CHAIN_ID,
      block: await EngineService.INSTANCE.getSM().latestProcessedBlockHeight(),
      time: new Date().toISOString(),
    };
  }

  async getGame(): Promise<Game> {
    throw new Error('Achievements not available for this game');
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return [];
  }

  async getPlayer(wallet: string): Promise<Player> {
    return { wallet };
  }

  async getNftOwner(nft_address: string): Promise<string> {
    throw new Error('No owner known for NFT address');
  }

  async getPlayerAchievements(wallet: string): Promise<PlayerAchievement[]> {
    return [];
  }
}

/** Set this to actually implement the achievements API for your game. */
export let achievementService: AchievementService = new AchievementService();

// ----------------------------------------------------------------------------
// Controller and routes per PRC-1

@Route('achievements')
export class AchievementsController extends Controller {
  @Get('public/list')
  public async public_list(
    @Query() category?: string,
    @Query() isActive?: boolean
  ): Promise<AchievementPublicList> {
    return {
      ...(await achievementService.getGame()),
      ...(await achievementService.getValidity()),
      achievements: (await achievementService.getAllAchievements())
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
    const player = await achievementService.getPlayer(wallet);
    const achievements = await achievementService.getPlayerAchievements(wallet);
    const nameSet = name ? new Set(name.split(',')) : null;
    return {
      ...(await achievementService.getValidity()),
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
    const wallet = await achievementService.getNftOwner(nft_address);
    return this.wallet(wallet, name);
  }
}
