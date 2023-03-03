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
