import type { GameStateMachine } from '@paima/sm';
import type { AchievementMetadata } from '@paima/utils-backend';

export class EngineService {
  // Useful stuff
  readonly stateMachine: GameStateMachine;
  readonly achievements: Promise<AchievementMetadata> | null;

  constructor(alike: {
    readonly stateMachine: GameStateMachine;
    readonly achievements: Promise<AchievementMetadata> | null;
  }) {
    this.stateMachine = alike.stateMachine;
    this.achievements = alike.achievements;
  }

  getSM = () => this.stateMachine;

  // Singleton
  private static _instance?: EngineService;
  static get INSTANCE(): EngineService {
    if (!this._instance) {
      throw new Error('EngineService not initialized');
    }
    return this._instance;
  }
  static set INSTANCE(value: EngineService) {
    this._instance = value;
  }
}
