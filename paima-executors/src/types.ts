export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export interface IGetRoundMovesResult {
  id: number;
  lobby_id: string;
  move_type: string;
  position: number | null;
  round: number;
  wallet: string;
}
export interface IGetCachedMovesResult {
  id: number;
  lobby_id: string;
  move_type: string;
  position: number | null;
  round: number;
  wallet: string;
}
export interface IGetActiveLobbyStateResult {
  avatar_nft: Json;
  final_round: number;
  grid_size: number;
  health: number;
  last_three_defeated_nfts: Json | null;
  lobby_id: string;
  losses: number;
  position: number;
  round: number;
  round_length: number;
  starting_block_height: number;
  ties: number;
  wallet: string;
  wins: number
}