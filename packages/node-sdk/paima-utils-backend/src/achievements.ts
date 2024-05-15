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
  /** CAIP-2 blockchain identifier */
  caip2: string;
  /** Optional date. ISO8601, like YYYY-MM-DDTHH:mm:ss.sssZ */
  time?: string;
}

/** Player info */
export interface Player {
  /** e.g. addr1234... or 0x1234... */
  wallet: string;
  /** (Optional) Wallet-type */
  walletType?: string; // ex: 'cardano' | 'evm' | 'polkadot' | 'algorand'
  /** (Optional) User ID for a specific player account. This value should be
   * immutable and define a specific account, as the wallet might be migrated
   * or updated. */
  userId?: string;
  /** (Optional) Player display name */
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
// Paima Engine types

/** The type of the `achievements` export of `endpoints.cjs`. */
export interface AchievementMetadata {
  /** Game ID, name, and version. */
  game: Game;
  /** Achievement types. */
  list: Achievement[];
  /**
   * Per-language overrides for achievement display names and descriptions.
   * Falls back to base definition whenever absent.
   */
  languages?: {
    [language: string]: {
      [name: string]: {
        displayName?: string;
        description?: string;
      };
    };
  };
}
