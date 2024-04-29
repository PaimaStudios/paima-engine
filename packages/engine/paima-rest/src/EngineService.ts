import type { GameStateMachine } from '@paima/sm';
import { AchievementService } from '@paima/utils-backend';

export class EngineService {
  public static INSTANCE = new EngineService();

  private runtime: GameStateMachine | undefined = undefined;

  public achievementService: AchievementService = new AchievementService();

  getSM = (): GameStateMachine => {
    if (this.runtime == null) {
      throw new Error('EngineService: SM not initialized');
    }
    return this.runtime;
  };

  updateSM = (runtime: GameStateMachine): void => {
    this.runtime = runtime;
  };
}
