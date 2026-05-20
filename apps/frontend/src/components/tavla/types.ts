export type Color = 'white' | 'black';

export interface Move {
  from: number | 'bar';
  to: number | 'off';
  die: number;
}

export interface GameState {
  board: number[];
  bar: { white: number; black: number };
  borneOff: { white: number; black: number };
  dice: number[];
  movesLeft: number[];
  turn: Color;
  phase: 'rolling' | 'moving' | 'ended';
  winner: Color | null;
}

export interface PlayerInfo {
  displayName: string;
  color: Color;
}
