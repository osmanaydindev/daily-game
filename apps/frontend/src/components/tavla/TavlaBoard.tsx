'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameState, Move, Color } from './types';

// ─── Board geometry ───────────────────────────────────────────────────────────
const W = 720, H = 500;
const BORDER = 18;
const BAR_W = 48;
const BOARD_W = W - 2 * BORDER;
const POINT_W = (BOARD_W - BAR_W) / 12;
const BOARD_Y = BORDER;
const BOARD_H = H - 2 * BORDER;
const HALF_H = BOARD_H / 2;
const POINT_H = HALF_H - 14;
const CR = Math.min(Math.floor(POINT_W / 2) - 2, 22);

function pointCol(idx: number): number { return idx < 12 ? 11 - idx : idx - 12; }
function colX(col: number): number {
  const halfLeft = BORDER + 6 * POINT_W + BAR_W;
  return col < 6 ? BORDER + col * POINT_W + POINT_W / 2 : halfLeft + (col - 6) * POINT_W + POINT_W / 2;
}
function pointX(idx: number): number { return colX(pointCol(idx)); }
function pointIsTop(idx: number): boolean { return idx >= 12; }

function checkerXY(idx: number, n: number): { x: number; y: number } {
  const x = pointX(idx);
  const isTop = pointIsTop(idx);
  const y = isTop
    ? BOARD_Y + CR + 2 + n * (CR * 2 + 2)
    : BOARD_Y + BOARD_H - CR - 2 - n * (CR * 2 + 2);
  return { x, y };
}
function barX(): number { return BORDER + 6 * POINT_W + BAR_W / 2; }
function barY(color: Color, n: number): number {
  return color === 'white'
    ? BOARD_Y + HALF_H + CR + 4 + n * (CR * 2 + 4)
    : BOARD_Y + HALF_H - CR - 4 - n * (CR * 2 + 4);
}

// ── Click hit-test ────────────────────────────────────────────────────────────
function hitTestPoint(cx: number, cy: number): number | 'bar' | 'off' | null {
  if (cx > W - BORDER) return 'off';
  const barLeft = BORDER + 6 * POINT_W;
  if (cx >= barLeft && cx <= barLeft + BAR_W) return 'bar';
  const isTop = cy < BOARD_Y + HALF_H;
  let col: number;
  if (cx >= BORDER && cx < BORDER + 6 * POINT_W) {
    col = Math.floor((cx - BORDER) / POINT_W);
  } else if (cx > barLeft + BAR_W && cx < W - BORDER) {
    col = 6 + Math.floor((cx - barLeft - BAR_W) / POINT_W);
  } else {
    return null;
  }
  if (col < 0 || col > 11) return null;
  return isTop ? col + 12 : 11 - col;
}

// ── Move animation helpers ────────────────────────────────────────────────────
function boardChanged(prev: GameState, next: GameState): boolean {
  return next.board.some((v, i) => v !== prev.board[i]) ||
    next.borneOff.white !== prev.borneOff.white ||
    next.borneOff.black !== prev.borneOff.black ||
    next.bar.white !== prev.bar.white ||
    next.bar.black !== prev.bar.black;
}

interface DetectedMove { from: number | 'bar'; to: number | 'bar' | 'off'; color: Color; }

function detectMove(prev: GameState, next: GameState): DetectedMove | null {
  let color: Color | null = null;
  let from: number | 'bar' = 'bar';

  if (next.bar.white < prev.bar.white) { color = 'white'; from = 'bar'; }
  else if (next.bar.black < prev.bar.black) { color = 'black'; from = 'bar'; }
  else {
    for (let i = 0; i < 24; i++) {
      if (Math.max(0, next.board[i]) < Math.max(0, prev.board[i])) { color = 'white'; from = i; break; }
      if (Math.max(0, -next.board[i]) < Math.max(0, -prev.board[i])) { color = 'black'; from = i; break; }
    }
  }
  if (!color) return null;

  let to: number | 'bar' | 'off' = 0;
  if (color === 'white') {
    if (next.borneOff.white > prev.borneOff.white) { to = 'off'; }
    else { for (let i = 0; i < 24; i++) if (Math.max(0, next.board[i]) > Math.max(0, prev.board[i])) { to = i; break; } }
  } else {
    if (next.borneOff.black > prev.borneOff.black) { to = 'off'; }
    else { for (let i = 0; i < 24; i++) if (Math.max(0, -next.board[i]) > Math.max(0, -prev.board[i])) { to = i; break; } }
  }
  return { from, to, color };
}

// ── Drawing helpers ───────────────────────────────────────────────────────────
function drawTriangle(ctx: CanvasRenderingContext2D, col: number, isTop: boolean, fill: string) {
  const x = colX(col);
  const yBase = isTop ? BOARD_Y : BOARD_Y + BOARD_H;
  const yTip  = isTop ? BOARD_Y + POINT_H : BOARD_Y + BOARD_H - POINT_H;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x - POINT_W / 2, yBase);
  ctx.lineTo(x + POINT_W / 2, yBase);
  ctx.lineTo(x, yTip);
  ctx.closePath();
  ctx.fill();
}

function drawChecker(ctx: CanvasRenderingContext2D, x: number, y: number, color: Color, highlight = false) {
  const isWhite = color === 'white';
  ctx.beginPath();
  ctx.arc(x, y, CR, 0, Math.PI * 2);
  ctx.fillStyle = isWhite ? '#e8e0d0' : '#2a1f1f';
  ctx.fill();
  ctx.strokeStyle = highlight ? '#4af' : (isWhite ? '#bbb' : '#555');
  ctx.lineWidth = highlight ? 2.5 : 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, CR - 5, 0, Math.PI * 2);
  ctx.strokeStyle = isWhite ? '#ccc4b0' : '#3d2e2e';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawDie(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, used: boolean) {
  const S = 34;
  ctx.fillStyle = used ? '#3a3a3c' : '#f5f0e8';
  ctx.strokeStyle = used ? '#555' : '#bbb';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - S / 2, y - S / 2, S, S, 6);
  ctx.fill(); ctx.stroke();
  const dots: Record<number, [number, number][]> = {
    1: [[0,0]], 2:[[-8,-8],[8,8]], 3:[[-8,-8],[0,0],[8,8]],
    4:[[-8,-8],[8,-8],[-8,8],[8,8]], 5:[[-8,-8],[8,-8],[0,0],[-8,8],[8,8]],
    6:[[-8,-8],[8,-8],[-8,0],[8,0],[-8,8],[8,8]],
  };
  ctx.fillStyle = used ? '#555' : '#2a1f1f';
  for (const [dx, dy] of dots[value] ?? []) {
    ctx.beginPath(); ctx.arc(x + dx, y + dy, 3.5, 0, Math.PI * 2); ctx.fill();
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  state: GameState;
  myColor: Color;
  flip: boolean;
  selected: number | 'bar' | null;
  validMoves: Move[];
  animDice: number[] | null;
  onPointClick: (idx: number | 'bar' | 'off') => void;
}

interface AnimInfo extends DetectedMove { displayState: GameState; }

export function TavlaBoard({ state, myColor, flip, selected, validMoves, animDice, onPointClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dark = '#1a3d2b', light = '#c8a96e', boardBg = '#2d5a3e', borderColor = '#8b6914';

  // ── Internal move animation ───────────────────────────────────────────────
  const prevStateRef  = useRef<GameState | null>(null);
  const animInfoRef   = useRef<AnimInfo | null>(null);
  const rafRef        = useRef<number | null>(null);
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (!prev || !boardChanged(prev, state)) return;

    const move = detectMove(prev, state);
    if (!move) return;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    animInfoRef.current = { ...move, displayState: prev };
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min((now - startTime) / 280, 1);
      setAnimProgress(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        animInfoRef.current = null;
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [state]);

  useEffect(() => () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    const anim = animInfoRef.current;
    // During animation, draw from the pre-move state with source piece removed
    const ds = anim ? anim.displayState : state;
    const drawBoard = [...ds.board];
    const drawBar   = { ...ds.bar };
    if (anim) {
      if (typeof anim.from === 'number') drawBoard[anim.from] -= anim.color === 'white' ? 1 : -1;
      else drawBar[anim.color] = Math.max(0, drawBar[anim.color] - 1);
    }

    ctx.save();
    if (flip) { ctx.translate(W, H); ctx.scale(-1, -1); }

    // Board background
    ctx.fillStyle = boardBg;
    ctx.fillRect(BORDER, BOARD_Y, BOARD_W, BOARD_H);
    ctx.fillStyle = '#1e4a2e';
    ctx.fillRect(BORDER + 6 * POINT_W, BOARD_Y, BAR_W, BOARD_H);

    // Triangles
    for (let col = 0; col < 12; col++) {
      const fill = col % 2 === 0 ? dark : light;
      drawTriangle(ctx, col, true, fill);
      drawTriangle(ctx, col, false, fill);
    }

    // Borders
    ctx.strokeStyle = borderColor; ctx.lineWidth = 3;
    ctx.strokeRect(BORDER, BOARD_Y, BOARD_W, BOARD_H);
    ctx.strokeRect(BORDER + 6 * POINT_W, BOARD_Y, BAR_W, BOARD_H);
    ctx.strokeStyle = borderColor + '55'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(BORDER, BOARD_Y + HALF_H); ctx.lineTo(W - BORDER, BOARD_Y + HALF_H);
    ctx.stroke();

    // ── Highlight valid destinations ──────────────────────────────────────
    const destSet = new Set(
      validMoves.filter(m => m.from === selected || (selected === 'bar' && m.from === 'bar')).map(m => m.to),
    );
    for (const dest of destSet) {
      if (dest === 'off') {
        ctx.fillStyle = 'rgba(100,255,120,0.25)';
        ctx.fillRect(W - BORDER, BOARD_Y, BORDER, BOARD_H);
        ctx.strokeStyle = 'rgba(100,255,120,0.7)'; ctx.lineWidth = 2;
        ctx.strokeRect(W - BORDER, BOARD_Y, BORDER, BOARD_H);
      } else {
        const dx = pointX(dest as number);
        const isTop = pointIsTop(dest as number);
        ctx.fillStyle = 'rgba(100,255,120,0.25)';
        const yStart = isTop ? BOARD_Y : BOARD_Y + HALF_H;
        ctx.fillRect(dx - POINT_W / 2, yStart, POINT_W, HALF_H);
        ctx.strokeStyle = 'rgba(100,255,120,0.7)'; ctx.lineWidth = 2;
        ctx.strokeRect(dx - POINT_W / 2, yStart, POINT_W, HALF_H);
      }
    }

    // ── Checkers on points ─────────────────────────────────────────────────
    for (let idx = 0; idx < 24; idx++) {
      const count = drawBoard[idx];
      if (count === 0) continue;
      const color: Color = count > 0 ? 'white' : 'black';
      const abs = Math.abs(count);
      for (let n = 0; n < Math.min(abs, 5); n++) {
        const { x, y } = checkerXY(idx, n);
        const isSelected = selected === idx && n === Math.min(abs, 5) - 1;
        drawChecker(ctx, x, y, color, isSelected);
      }
      if (abs > 5) {
        const { x, y } = checkerXY(idx, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.beginPath(); ctx.arc(x, y, CR, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${CR}px system-ui`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(abs), x, y);
      }
    }

    // ── Bar checkers ───────────────────────────────────────────────────────
    const bx = barX();
    for (let n = 0; n < drawBar.white; n++) {
      const y = barY('white', n);
      drawChecker(ctx, bx, y, 'white', selected === 'bar' && myColor === 'white' && n === drawBar.white - 1);
    }
    for (let n = 0; n < drawBar.black; n++) {
      const y = barY('black', n);
      drawChecker(ctx, bx, y, 'black', selected === 'bar' && myColor === 'black' && n === drawBar.black - 1);
    }

    // ── Borne-off indicators ───────────────────────────────────────────────
    if (ds.borneOff.white > 0) {
      for (let n = 0; n < Math.min(ds.borneOff.white, 15); n++) {
        ctx.fillStyle = '#e8e0d0';
        ctx.fillRect(W - BORDER + 2, BOARD_Y + BOARD_H - 4 - n * 6 - 3, BORDER - 4, 5);
      }
    }
    if (ds.borneOff.black > 0) {
      for (let n = 0; n < Math.min(ds.borneOff.black, 15); n++) {
        ctx.fillStyle = '#2a1f1f';
        ctx.fillRect(W - BORDER + 2, BOARD_Y + 4 + n * 6 - 2, BORDER - 4, 4);
      }
    }

    // ── Animated moving piece ──────────────────────────────────────────────
    if (anim) {
      const ease = 1 - Math.pow(1 - animProgress, 3);

      let fx: number, fy: number;
      if (anim.from === 'bar') {
        const n = Math.max(0, anim.displayState.bar[anim.color] - 1);
        fx = bx; fy = barY(anim.color, n);
      } else {
        const count = Math.abs(anim.displayState.board[anim.from as number]);
        const pos = checkerXY(anim.from as number, Math.max(0, count - 1));
        fx = pos.x; fy = pos.y;
      }

      let tx: number, ty: number;
      if (anim.to === 'off') {
        tx = W - BORDER / 2;
        ty = anim.color === 'white' ? BOARD_Y + BOARD_H - 10 : BOARD_Y + 10;
      } else if (anim.to === 'bar') {
        const n = state.bar[anim.color] - 1;
        tx = bx; ty = barY(anim.color, Math.max(0, n));
      } else {
        const friendly = anim.color === 'white'
          ? Math.max(0, state.board[anim.to as number])
          : Math.max(0, -state.board[anim.to as number]);
        const pos = checkerXY(anim.to as number, Math.max(0, friendly - 1));
        tx = pos.x; ty = pos.y;
      }

      const ax = fx + (tx - fx) * ease;
      const ay = fy + (ty - fy) * ease;
      // Draw slight shadow for depth
      ctx.globalAlpha = 0.2;
      ctx.beginPath(); ctx.arc(ax + 2, ay + 3, CR, 0, Math.PI * 2);
      ctx.fillStyle = '#000'; ctx.fill();
      ctx.globalAlpha = 1;
      drawChecker(ctx, ax, ay, anim.color);
    }

    ctx.restore();

    // ── Dice — drawn after restore (always upright) ───────────────────────
    const displayDice = animDice ?? state.dice;
    if (displayDice.length > 0) {
      const usedCount = animDice ? 0 : state.dice.length - state.movesLeft.length;
      const diceY = BOARD_Y + HALF_H;
      const startX = barX() - ((displayDice.length - 1) * 40) / 2;
      for (let i = 0; i < displayDice.length; i++) {
        drawDie(ctx, startX + i * 40, diceY, displayDice[i], !animDice && i < usedCount);
      }
    }

    // ── Point labels ──────────────────────────────────────────────────────
    if (!flip) {
      ctx.font = '10px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let idx = 0; idx < 24; idx++) {
        const x = pointX(idx);
        const isTop = pointIsTop(idx);
        ctx.fillText(String(idx + 1), x, isTop ? BOARD_Y + 6 : BOARD_Y + BOARD_H - 6);
      }
    }
  }, [state, myColor, flip, selected, validMoves, animDice, animProgress, dark, light, boardBg, borderColor]);

  // ── Click handler ──────────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) * (W / rect.width);
    const rawY = (e.clientY - rect.top) * (H / rect.height);
    const cx = flip ? W - rawX : rawX;
    const cy = flip ? H - rawY : rawY;
    const hit = hitTestPoint(cx, cy);
    if (hit !== null) onPointClick(hit);
  }, [flip, onPointClick]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onClick={handleClick}
      style={{ width: '100%', display: 'block', cursor: 'pointer' }}
    />
  );
}
