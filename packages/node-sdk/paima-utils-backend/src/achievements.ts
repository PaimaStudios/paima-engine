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
  walletType?: string; // ex: 'cardano' | 'evm' | 'polkadot' | 'algorand'
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
