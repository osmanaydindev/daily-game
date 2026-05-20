'use client';

import { useRef, useEffect, useCallback } from 'react';
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

// ── Point index → screen column (0–11) ───────────────────────────────────────
function pointCol(idx: number): number {
  return idx < 12 ? 11 - idx : idx - 12;
}

function colX(col: number): number {
  const halfLeft = BORDER + 6 * POINT_W + BAR_W;
  return col < 6
    ? BORDER + col * POINT_W + POINT_W / 2
    : halfLeft + (col - 6) * POINT_W + POINT_W / 2;
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

// ── Click hit-test → point index, 'bar', 'off', or null ──────────────────────
function hitTestPoint(cx: number, cy: number): number | 'bar' | 'off' | null {
  // Bear-off zone: right border strip
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

// ── Drawing helpers ───────────────────────────────────────────────────────────
function drawTriangle(ctx: CanvasRenderingContext2D, col: number, isTop: boolean, fill: string) {
  const x = colX(col);
  const yBase = isTop ? BOARD_Y : BOARD_Y + BOARD_H;
  const yTip = isTop ? BOARD_Y + POINT_H : BOARD_Y + BOARD_H - POINT_H;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x - POINT_W / 2, yBase);
  ctx.lineTo(x + POINT_W / 2, yBase);
  ctx.lineTo(x, yTip);
  ctx.closePath();
  ctx.fill();
}

function drawChecker(ctx: CanvasRenderingContext2D, x: number, y: number, color: Color) {
  const isWhite = color === 'white';
  ctx.beginPath();
  ctx.arc(x, y, CR, 0, Math.PI * 2);
  ctx.fillStyle = isWhite ? '#e8e0d0' : '#2a1f1f';
  ctx.fill();
  ctx.strokeStyle = isWhite ? '#bbb' : '#555';
  ctx.lineWidth = 2;
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
  ctx.fill();
  ctx.stroke();

  const dots: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [[-8, -8], [8, 8]],
    3: [[-8, -8], [0, 0], [8, 8]],
    4: [[-8, -8], [8, -8], [-8, 8], [8, 8]],
    5: [[-8, -8], [8, -8], [0, 0], [-8, 8], [8, 8]],
    6: [[-8, -8], [8, -8], [-8, 0], [8, 0], [-8, 8], [8, 8]],
  };
  ctx.fillStyle = used ? '#555' : '#2a1f1f';
  for (const [dx, dy] of dots[value] ?? []) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, 3.5, 0, Math.PI * 2);
    ctx.fill();
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

export function TavlaBoard({ state, myColor, flip, selected, validMoves, animDice, onPointClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dark = '#1a3d2b';
  const light = '#c8a96e';
  const boardBg = '#2d5a3e';
  const borderColor = '#8b6914';

  // ── Render ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);

    // Apply 180° flip for black player
    ctx.save();
    if (flip) {
      ctx.translate(W, H);
      ctx.scale(-1, -1);
    }

    // Background
    ctx.fillStyle = boardBg;
    ctx.fillRect(BORDER, BOARD_Y, BOARD_W, BOARD_H);

    // Bar
    ctx.fillStyle = '#1e4a2e';
    ctx.fillRect(BORDER + 6 * POINT_W, BOARD_Y, BAR_W, BOARD_H);

    // Triangles
    for (let col = 0; col < 12; col++) {
      const fill = col % 2 === 0 ? dark : light;
      drawTriangle(ctx, col, true, fill);
      drawTriangle(ctx, col, false, fill);
    }

    // Board border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(BORDER, BOARD_Y, BOARD_W, BOARD_H);
    ctx.strokeRect(BORDER + 6 * POINT_W, BOARD_Y, BAR_W, BOARD_H);

    // Center divider line
    ctx.strokeStyle = borderColor + '55';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(BORDER, BOARD_Y + HALF_H);
    ctx.lineTo(W - BORDER, BOARD_Y + HALF_H);
    ctx.stroke();

    // ── Highlight valid destinations ─────────────────────────────────────────
    const destSet = new Set(
      validMoves
        .filter(m => m.from === selected || (selected === 'bar' && m.from === 'bar'))
        .map(m => m.to),
    );

    for (const dest of destSet) {
      if (dest === 'off') {
        // Bear-off highlight — always right border in canvas coords
        // After flip transform it appears on the visually correct side
        ctx.fillStyle = 'rgba(100,255,120,0.25)';
        ctx.fillRect(W - BORDER, BOARD_Y, BORDER, BOARD_H);
        ctx.strokeStyle = 'rgba(100,255,120,0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(W - BORDER, BOARD_Y, BORDER, BOARD_H);
      } else {
        const dx = pointX(dest as number);
        const isTop = pointIsTop(dest as number);
        ctx.fillStyle = 'rgba(100,255,120,0.25)';
        const yStart = isTop ? BOARD_Y : BOARD_Y + HALF_H;
        ctx.fillRect(dx - POINT_W / 2, yStart, POINT_W, HALF_H);
        ctx.strokeStyle = 'rgba(100,255,120,0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(dx - POINT_W / 2, yStart, POINT_W, HALF_H);
      }
    }

    // ── Checkers on points ───────────────────────────────────────────────────
    for (let idx = 0; idx < 24; idx++) {
      const count = state.board[idx];
      if (count === 0) continue;
      const color: Color = count > 0 ? 'white' : 'black';
      const abs = Math.abs(count);
      for (let n = 0; n < Math.min(abs, 5); n++) {
        const { x, y } = checkerXY(idx, n);
        drawChecker(ctx, x, y, color);
        if (selected === idx && n === 0) {
          ctx.beginPath();
          ctx.arc(x, y, CR + 3, 0, Math.PI * 2);
          ctx.strokeStyle = '#4af';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }
      if (abs > 5) {
        const { x, y } = checkerXY(idx, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.beginPath();
        ctx.arc(x, y, CR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${CR}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(abs), x, y);
      }
    }

    // ── Bar checkers ─────────────────────────────────────────────────────────
    const bx = barX();
    for (let n = 0; n < state.bar.white; n++) {
      const y = BOARD_Y + HALF_H + CR + 4 + n * (CR * 2 + 4);
      drawChecker(ctx, bx, y, 'white');
      if (selected === 'bar' && myColor === 'white' && n === 0) {
        ctx.beginPath(); ctx.arc(bx, y, CR + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#4af'; ctx.lineWidth = 2.5; ctx.stroke();
      }
    }
    for (let n = 0; n < state.bar.black; n++) {
      const y = BOARD_Y + HALF_H - CR - 4 - n * (CR * 2 + 4);
      drawChecker(ctx, bx, y, 'black');
      if (selected === 'bar' && myColor === 'black' && n === 0) {
        ctx.beginPath(); ctx.arc(bx, y, CR + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#4af'; ctx.lineWidth = 2.5; ctx.stroke();
      }
    }

    // ── Borne-off indicators (right border in canvas coords) ─────────────────
    if (state.borneOff.white > 0) {
      for (let n = 0; n < Math.min(state.borneOff.white, 15); n++) {
        const y = BOARD_Y + BOARD_H - 4 - n * 6;
        ctx.fillStyle = '#e8e0d0';
        ctx.fillRect(W - BORDER + 2, y - 3, BORDER - 4, 5);
      }
    }
    if (state.borneOff.black > 0) {
      for (let n = 0; n < Math.min(state.borneOff.black, 15); n++) {
        const y = BOARD_Y + 4 + n * 6;
        ctx.fillStyle = '#2a1f1f';
        ctx.fillRect(W - BORDER + 2, y - 2, BORDER - 4, 4);
      }
    }

    ctx.restore();

    // ── Dice — drawn after restore so always upright ──────────────────────────
    const displayDice = animDice ?? state.dice;
    if (displayDice.length > 0) {
      const usedCount = animDice ? 0 : state.dice.length - state.movesLeft.length;
      const diceY = BOARD_Y + HALF_H;
      const startX = barX() - ((displayDice.length - 1) * 40) / 2;
      for (let i = 0; i < displayDice.length; i++) {
        drawDie(ctx, startX + i * 40, diceY, displayDice[i], !animDice && i < usedCount);
      }
    }

    // ── Point labels (only unflipped, debug aid) ──────────────────────────────
    if (!flip) {
      ctx.font = '10px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let idx = 0; idx < 24; idx++) {
        const x = pointX(idx);
        const isTop = pointIsTop(idx);
        ctx.fillText(String(idx + 1), x, isTop ? BOARD_Y + 6 : BOARD_Y + BOARD_H - 6);
      }
    }
  }, [state, myColor, flip, selected, validMoves, animDice, dark, light, boardBg, borderColor]);

  // ── Click handler ──────────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;
    // Invert coordinates for black (flipped board)
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
      style={{ width: '100%', maxWidth: W, cursor: 'pointer', display: 'block' }}
    />
  );
}
