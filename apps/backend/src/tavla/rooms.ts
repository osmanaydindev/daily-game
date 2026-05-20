import type { GameState, Color } from './engine';

export interface RoomPlayer {
  userId: string;
  displayName: string;
  socketId: string;
  color: Color;
  connected: boolean;
}

export interface Room {
  code: string;
  players: RoomPlayer[];
  state: GameState | null;
  createdAt: number;
}

const rooms = new Map<string, Room>();
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const STALE_MS = 2 * 60 * 60 * 1000;

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return code;
}

function cleanup(): void {
  const now = Date.now();
  for (const [k, r] of rooms) if (now - r.createdAt > STALE_MS) rooms.delete(k);
}

export function createRoom(userId: string, displayName: string, socketId: string): Room {
  cleanup();
  let code: string;
  do { code = generateCode(); } while (rooms.has(code));
  const room: Room = {
    code,
    players: [{ userId, displayName, socketId, color: 'white', connected: true }],
    state: null,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(
  code: string, userId: string, displayName: string, socketId: string,
): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;
  if (room.players.filter(p => p.connected).length >= 2) return null;
  if (room.players[0].userId === userId) return null;
  room.players.push({ userId, displayName, socketId, color: 'black', connected: true });
  return room;
}

export function rejoinRoom(code: string, userId: string, socketId: string): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room?.state) return null;
  const player = room.players.find(p => p.userId === userId);
  if (!player) return null;
  player.socketId = socketId;
  player.connected = true;
  return room;
}

export function getRoomBySocketId(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.socketId === socketId)) return room;
  }
}

// Mark disconnected but keep room alive for rejoin
export function disconnectPlayer(socketId: string): { room: Room; player: RoomPlayer } | null {
  for (const room of rooms.values()) {
    const player = room.players.find(p => p.socketId === socketId);
    if (player) {
      player.connected = false;
      return { room, player };
    }
  }
  return null;
}
