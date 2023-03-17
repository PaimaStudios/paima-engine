import type Prando from '@paima/prando';

export type RoundExecutor<MatchState = any, TickEvent = any> = {
  currentTick: number;
  currentState: MatchState;
  tick: () => TickEvent[] | null;
  endState: () => MatchState;
};

export type MatchExecutor<MatchState = any, TickEvent = any> = {
  currentRound: number;
  currentState: MatchState;
  roundExecutor: null | {
    currentTick: number;
    currentState: MatchState;
    tick: () => TickEvent[] | null;
    endState: () => MatchState;
  };
  __nextRound: () => void;
  tick: () => TickEvent[] | NewRoundEvent[] | null;
};

export type ProcessTickFn<MatchEnvironment, MatchState, MoveType, TickEvent> = (
  matchEnvironment: MatchEnvironment,
  matchState: MatchState,
  submittedMoves: MoveType[],
  currentTick: number,
  randomnessGenerator: Prando
) => TickEvent[] | null;

export interface RoundNumbered {
  round: number;
}

export interface Seed {
  seed: string;
  block_height: number;
  round: number;
}

export interface NewRoundEvent {
  eventType: 'newRound';
  roundNumber: number;
}
