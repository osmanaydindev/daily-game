export type Color = 'white' | 'black';

export interface Move {
  from: number | 'bar';
  to: number | 'off';
  die: number;
}

export interface GameState {
  board: number[];              // 24 elements: +N = N white, -N = N black
  bar: { white: number; black: number };
  borneOff: { white: number; black: number };
  dice: number[];               // [d1, d2] or [d,d,d,d] for doubles
  movesLeft: number[];          // remaining dice to use this turn
  turn: Color;
  phase: 'rolling' | 'moving' | 'ended';
  winner: Color | null;
}

// Board indices 0–23 = points 1–24
// White moves 24→1 (high to low), enters bar on black home (pts 19–24 = indices 18–23)
// Black moves 1→24 (low to high), enters bar on white home (pts 1–6 = indices 0–5)
const INITIAL_BOARD: number[] = (() => {
  const b = Array(24).fill(0);
  b[23] = 2; b[12] = 5; b[7] = 3; b[5] = 5;     // white
  b[0] = -2; b[11] = -5; b[16] = -3; b[18] = -5; // black
  return b;
})();

export function createInitialState(): GameState {
  return {
    board: [...INITIAL_BOARD],
    bar: { white: 0, black: 0 },
    borneOff: { white: 0, black: 0 },
    dice: [],
    movesLeft: [],
    turn: 'white',
    phase: 'rolling',
    winner: null,
  };
}

export function rollDice(): [number, number] {
  return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
}

export function applyRoll(state: GameState, d1: number, d2: number): GameState {
  const movesLeft = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
  return { ...state, dice: [d1, d2], movesLeft, phase: 'moving' };
}

function myCount(board: number[], idx: number, color: Color): number {
  return color === 'white' ? Math.max(0, board[idx]) : Math.max(0, -board[idx]);
}

function isBlocked(board: number[], idx: number, color: Color): boolean {
  return color === 'white' ? board[idx] <= -2 : board[idx] >= 2;
}

function allInHome(state: GameState, color: Color): boolean {
  if (state.bar[color] > 0) return false;
  const [lo, hi] = color === 'white' ? [0, 6] : [18, 24];
  let inHome = 0;
  for (let i = lo; i < hi; i++) inHome += myCount(state.board, i, color);
  return inHome === 15 - state.borneOff[color];
}

// Returns the index of the checker furthest from bearing off within the home board
function furthestFromExit(board: number[], color: Color): number {
  if (color === 'white') {
    for (let i = 5; i >= 0; i--) if (board[i] > 0) return i;
  } else {
    for (let i = 18; i < 24; i++) if (board[i] < 0) return i;
  }
  return -1;
}

export function getLegalMoves(state: GameState): Move[] {
  if (state.phase !== 'moving' || state.movesLeft.length === 0) return [];
  const { board, bar, movesLeft, turn } = state;
  const uniqueDice = [...new Set(movesLeft)];
  const moves: Move[] = [];

  // Bar checkers must enter first
  if (bar[turn] > 0) {
    for (const die of uniqueDice) {
      // White enters black's home (pts 19–24 = indices 18–23): index = 24 - die
      // Black enters white's home (pts 1–6 = indices 0–5): index = die - 1
      const entryIdx = turn === 'white' ? 24 - die : die - 1;
      if (!isBlocked(board, entryIdx, turn)) {
        moves.push({ from: 'bar', to: entryIdx, die });
      }
    }
    return moves;
  }

  const canBearOff = allInHome(state, turn);

  for (const die of uniqueDice) {
    for (let i = 0; i < 24; i++) {
      if (myCount(board, i, turn) === 0) continue;
      const toIdx = turn === 'white' ? i - die : i + die;

      if (canBearOff) {
        if (turn === 'white' && i <= 5) {
          if (toIdx === -1) { moves.push({ from: i, to: 'off', die }); continue; }
          if (toIdx < -1 && furthestFromExit(board, 'white') === i) {
            moves.push({ from: i, to: 'off', die }); continue;
          }
        }
        if (turn === 'black' && i >= 18) {
          if (toIdx === 24) { moves.push({ from: i, to: 'off', die }); continue; }
          if (toIdx > 24 && furthestFromExit(board, 'black') === i) {
            moves.push({ from: i, to: 'off', die }); continue;
          }
        }
      }

      if (toIdx < 0 || toIdx >= 24) continue;
      if (!isBlocked(board, toIdx, turn)) {
        moves.push({ from: i, to: toIdx, die });
      }
    }
  }

  return moves;
}

export function applyMove(state: GameState, move: Move): GameState {
  const board = [...state.board];
  const bar = { ...state.bar };
  const borneOff = { ...state.borneOff };
  const sign = state.turn === 'white' ? 1 : -1;

  // Remove from source
  if (move.from === 'bar') {
    bar[state.turn]--;
  } else {
    board[move.from as number] -= sign;
  }

  // Apply to destination
  if (move.to === 'off') {
    borneOff[state.turn]++;
  } else {
    const to = move.to as number;
    // Hit opponent blot
    if (board[to] === -sign) {
      board[to] = 0;
      const opp: Color = state.turn === 'white' ? 'black' : 'white';
      bar[opp]++;
    }
    board[to] += sign;
  }

  // Remove used die
  const movesLeft = [...state.movesLeft];
  movesLeft.splice(movesLeft.indexOf(move.die), 1);

  // Check winner
  if (borneOff[state.turn] === 15) {
    return { ...state, board, bar, borneOff, movesLeft: [], phase: 'ended', winner: state.turn };
  }

  const newState: GameState = { ...state, board, bar, borneOff, movesLeft };

  // Auto-switch if no moves left or no legal moves remain
  if (movesLeft.length === 0 || getLegalMoves(newState).length === 0) {
    const next: Color = state.turn === 'white' ? 'black' : 'white';
    return { ...newState, turn: next, phase: 'rolling', movesLeft: [] };
  }

  return newState;
}
