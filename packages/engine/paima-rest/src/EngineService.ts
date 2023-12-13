import type { GameStateMachine } from '@paima/sm';

export class EngineService {
  public static INSTANCE = new EngineService();

  private runtime: GameStateMachine | undefined = undefined;

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
