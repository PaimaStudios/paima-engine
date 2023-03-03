// Placeholder types for the time being
export type RoundExecutor = any;
export type MatchExecutor = any;

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
