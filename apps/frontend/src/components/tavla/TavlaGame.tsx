'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, VStack, HStack, Text, Button, Input, Alert, Spinner,
} from '@chakra-ui/react';
import { TavlaBoard } from './TavlaBoard';
import type { GameState, Move, Color, PlayerInfo } from './types';
import { createTavlaSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

// ── Dice sound via Web Audio API ──────────────────────────────────────────────
function playDiceSound() {
  try {
    const actx = new AudioContext();
    // Clatter clicks at increasing intervals
    const times = [0, 0.07, 0.13, 0.19, 0.27, 0.37, 0.49, 0.63, 0.79, 0.97, 1.17];
    times.forEach(t => {
      const buf = actx.createBuffer(1, Math.ceil(actx.sampleRate * 0.025), actx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
      const src = actx.createBufferSource();
      src.buffer = buf;
      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.5, actx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + t + 0.025);
      src.connect(gain);
      gain.connect(actx.destination);
      src.start(actx.currentTime + t);
    });
    setTimeout(() => actx.close(), 1800);
  } catch {
    // AudioContext not available — silently skip
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getLegalMoves(state: GameState, myColor: Color): Move[] {
  if (state.phase !== 'moving' || state.turn !== myColor) return [];
  const { board, bar, movesLeft } = state;
  const unique = [...new Set(movesLeft)];
  const moves: Move[] = [];

  const myCount = (idx: number) =>
    myColor === 'white' ? Math.max(0, board[idx]) : Math.max(0, -board[idx]);
  const blocked = (idx: number) =>
    myColor === 'white' ? board[idx] <= -2 : board[idx] >= 2;

  const allInHome = () => {
    if (bar[myColor] > 0) return false;
    const [lo, hi] = myColor === 'white' ? [0, 6] : [18, 24];
    let cnt = 0;
    for (let i = lo; i < hi; i++) cnt += myCount(i);
    return cnt === 15 - state.borneOff[myColor];
  };

  const furthest = () => {
    if (myColor === 'white') {
      for (let i = 5; i >= 0; i--) if (board[i] > 0) return i;
    } else {
      for (let i = 18; i < 24; i++) if (board[i] < 0) return i;
    }
    return -1;
  };

  if (bar[myColor] > 0) {
    for (const die of unique) {
      const entry = myColor === 'white' ? 24 - die : die - 1;
      if (!blocked(entry)) moves.push({ from: 'bar', to: entry, die });
    }
    return moves;
  }

  const canBO = allInHome();
  for (const die of unique) {
    for (let i = 0; i < 24; i++) {
      if (myCount(i) === 0) continue;
      const to = myColor === 'white' ? i - die : i + die;
      if (canBO) {
        if (myColor === 'white' && i <= 5) {
          if (to === -1) { moves.push({ from: i, to: 'off', die }); continue; }
          if (to < -1 && furthest() === i) { moves.push({ from: i, to: 'off', die }); continue; }
        }
        if (myColor === 'black' && i >= 18) {
          if (to === 24) { moves.push({ from: i, to: 'off', die }); continue; }
          if (to > 24 && furthest() === i) { moves.push({ from: i, to: 'off', die }); continue; }
        }
      }
      if (to < 0 || to >= 24) continue;
      if (!blocked(to)) moves.push({ from: i, to, die });
    }
  }
  return moves;
}

// ── Lobby ─────────────────────────────────────────────────────────────────────
function Lobby({
  onCreateRoom,
  onJoinRoom,
  createdCode,
  error,
  joining,
}: {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  createdCode: string | null;
  error: string | null;
  joining: boolean;
}) {
  const [code, setCode] = useState('');

  return (
    <VStack gap={6} maxW="360px" mx="auto" pt={8}>
      <Box textAlign="center">
        <Text fontSize="2xl" fontWeight="800" mb={1}>Tavla</Text>
        <Text fontSize="sm" color="text.muted">Oda oluştur veya oda kodunu girerek katıl</Text>
      </Box>

      {error && (
        <Alert.Root status="error" borderRadius="lg" w="full">
          <Alert.Indicator />
          <Alert.Title fontSize="sm">{error}</Alert.Title>
        </Alert.Root>
      )}

      <Box w="full" bg="surface.card" borderRadius="xl" borderWidth="1px" borderColor="border.subtle" p={5}>
        <Text fontWeight="700" mb={3}>Yeni Oda Oluştur</Text>
        <Button w="full" colorPalette="brand" variant="solid" onClick={onCreateRoom} loading={joining}>
          Oda Oluştur
        </Button>
        {createdCode && (
          <Box mt={3} p={3} bg="surface.subtle" borderRadius="lg" textAlign="center">
            <Text fontSize="xs" color="text.muted" mb={1}>Oda kodu — rakibine gönder</Text>
            <Text fontSize="2xl" fontWeight="900" fontFamily="mono" letterSpacing="widest">
              {createdCode}
            </Text>
            <Text fontSize="xs" color="text.muted" mt={1}>Rakibin katılmasını bekliyorsun...</Text>
          </Box>
        )}
      </Box>

      <Box w="full" bg="surface.card" borderRadius="xl" borderWidth="1px" borderColor="border.subtle" p={5}>
        <Text fontWeight="700" mb={3}>Odaya Katıl</Text>
        <HStack>
          <Input
            placeholder="Oda kodu"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            fontFamily="mono"
            fontSize="lg"
            fontWeight="700"
            letterSpacing="widest"
          />
          <Button
            colorPalette="brand"
            variant="outline"
            onClick={() => onJoinRoom(code)}
            disabled={code.length !== 6}
            loading={joining}
          >
            Katıl
          </Button>
        </HStack>
      </Box>
    </VStack>
  );
}

// ── Main game component ───────────────────────────────────────────────────────
interface TavlaGameProps {
  user: { _id: string; displayName: string };
}

const STORAGE_KEY = 'tavla-room';

export function TavlaGame({ user }: TavlaGameProps) {
  const socketRef = useRef<Socket | null>(null);
  const prevPhaseRef = useRef<string | null>(null);
  const animatingRef = useRef(false);
  const pendingStateRef = useRef<GameState | null>(null);
  const rejoinAttemptRef = useRef(false);

  const [phase, setPhase] = useState<'lobby' | 'waiting' | 'playing'>('lobby');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myColor, setMyColor] = useState<Color>('white');
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | 'bar' | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [joining, setJoining] = useState(false);
  const [animDice, setAnimDice] = useState<number[] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // ── Dice animation ─────────────────────────────────────────────────────────
  const startDiceAnimation = useCallback((finalState: GameState) => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setIsAnimating(true);
    pendingStateRef.current = finalState;
    playDiceSound();

    // Frame delays: fast→slow (ms between frames)
    const deltas = [45, 55, 65, 80, 95, 115, 140, 165, 195, 230, 0];
    let elapsed = 0;
    deltas.forEach((delta, i) => {
      elapsed += delta;
      setTimeout(() => {
        if (i < deltas.length - 1) {
          setAnimDice([
            Math.ceil(Math.random() * 6),
            Math.ceil(Math.random() * 6),
          ]);
        } else {
          // Animation done — apply real state
          setAnimDice(null);
          setIsAnimating(false);
          animatingRef.current = false;
          const s = pendingStateRef.current!;
          setGameState(s);
          prevPhaseRef.current = s.phase;
          setSelected(null);
          setValidMoves([]);
        }
      }, elapsed);
    });
  }, []);

  // ── Socket setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    const s = createTavlaSocket();
    socketRef.current = s;

    s.on('tavla:created', ({ code }: { code: string }) => {
      setCreatedCode(code);
      setPhase('waiting');
      setJoining(false);
    });

    s.on('tavla:game_start', ({
      state,
      myColor: mc,
      players: pl,
      code,
    }: { state: GameState; myColor: Color; players: PlayerInfo[]; code: string }) => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ code, color: mc }));
      prevPhaseRef.current = state.phase;
      setGameState(state);
      setMyColor(mc);
      setPlayers(pl);
      setPhase('playing');
    });

    s.on('tavla:reconnected', ({
      state,
      myColor: mc,
      players: pl,
      code,
    }: { state: GameState; myColor: Color; players: PlayerInfo[]; code: string }) => {
      rejoinAttemptRef.current = false;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ code, color: mc }));
      prevPhaseRef.current = state.phase;
      setGameState(state);
      setMyColor(mc);
      setPlayers(pl);
      setPhase('playing');
      setJoining(false);
    });

    s.on('tavla:state', ({ state }: { state: GameState }) => {
      const prevPhase = prevPhaseRef.current;
      // Detect dice roll: dice just appeared and previous phase was rolling
      if (state.dice.length > 0 && prevPhase === 'rolling' && !animatingRef.current) {
        prevPhaseRef.current = state.phase;
        startDiceAnimation(state);
      } else if (!animatingRef.current) {
        prevPhaseRef.current = state.phase;
        setGameState(state);
        setSelected(null);
        setValidMoves([]);
      }
    });

    s.on('tavla:error', ({ message }: { message: string }) => {
      if (rejoinAttemptRef.current) {
        rejoinAttemptRef.current = false;
        sessionStorage.removeItem(STORAGE_KEY);
      }
      setError(message);
      setTimeout(() => setError(null), 3000);
      setJoining(false);
    });

    s.on('tavla:opponent_left', () => {
      setOpponentLeft(true);
    });

    s.on('tavla:opponent_reconnected', () => {
      setOpponentLeft(false);
    });

    s.on('connect_error', () => {
      setError('Sunucuya bağlanılamadı.');
      setJoining(false);
    });

    // Attempt rejoin if we have a saved session
    s.on('connect', () => {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const { code } = JSON.parse(raw) as { code: string; color: Color };
          rejoinAttemptRef.current = true;
          s.emit('tavla:rejoin', { code });
        } catch {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    });

    return () => { s.disconnect(); };
  }, [startDiceAnimation]);

  const handleCreateRoom = useCallback(() => {
    setJoining(true);
    setError(null);
    socketRef.current?.emit('tavla:create', { displayName: user.displayName });
  }, [user.displayName]);

  const handleJoinRoom = useCallback((code: string) => {
    setJoining(true);
    setError(null);
    socketRef.current?.emit('tavla:join', { code, displayName: user.displayName });
  }, [user.displayName]);

  const handleRoll = useCallback(() => {
    if (isAnimating) return;
    socketRef.current?.emit('tavla:roll');
  }, [isAnimating]);

  const handleResign = useCallback(() => {
    if (confirm('Oyunu teslim etmek istiyor musun?')) {
      socketRef.current?.emit('tavla:resign');
    }
  }, []);

  // ── Point click (select + move) ────────────────────────────────────────────
  const handlePointClick = useCallback((idx: number | 'bar' | 'off') => {
    if (!gameState || gameState.phase !== 'moving' || gameState.turn !== myColor) return;

    // Bear-off click
    if (idx === 'off') {
      if (selected !== null) {
        const offMove = validMoves.find(m => m.from === selected && m.to === 'off');
        if (offMove) {
          socketRef.current?.emit('tavla:move', offMove);
          setSelected(null);
          setValidMoves([]);
        }
      }
      return;
    }

    const allMoves = getLegalMoves(gameState, myColor);

    // Clicking a valid destination → move
    if (selected !== null) {
      const matchingMoves = allMoves.filter(m =>
        m.from === selected && m.to === idx,
      );
      if (matchingMoves.length > 0) {
        socketRef.current?.emit('tavla:move', matchingMoves[0]);
        setSelected(null);
        setValidMoves([]);
        return;
      }
    }

    // Select a checker
    const isMyChecker = idx === 'bar'
      ? gameState.bar[myColor] > 0
      : (myColor === 'white'
        ? gameState.board[idx as number] > 0
        : gameState.board[idx as number] < 0);

    if (isMyChecker) {
      const movesFromHere = allMoves.filter(m => m.from === idx);
      if (movesFromHere.length > 0) {
        setSelected(idx);
        setValidMoves(movesFromHere);
        return;
      }
    }

    setSelected(null);
    setValidMoves([]);
  }, [gameState, myColor, selected, validMoves]);

  // ── Phase: lobby / waiting ─────────────────────────────────────────────────
  if (phase === 'lobby' || phase === 'waiting') {
    return (
      <Lobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        createdCode={phase === 'waiting' ? createdCode : null}
        error={error}
        joining={joining}
      />
    );
  }

  // ── Phase: playing ─────────────────────────────────────────────────────────
  if (!gameState) return <Box display="flex" justifyContent="center" pt={20}><Spinner /></Box>;

  const isMyTurn = gameState.turn === myColor;
  const oppInfo = players.find(p => p.color !== myColor);
  const myInfo = players.find(p => p.color === myColor);
  const flip = myColor === 'black';

  const statusMsg = () => {
    if (gameState.phase === 'ended') {
      return gameState.winner === myColor ? '🏆 Kazandın!' : '😔 Kaybettin';
    }
    if (opponentLeft) return 'Rakip oyundan ayrıldı.';
    if (isAnimating) return 'Zar atıldı...';
    if (!isMyTurn) return `${oppInfo?.displayName ?? 'Rakip'} oynuyor...`;
    if (gameState.phase === 'rolling') return 'Zarını at!';
    return gameState.movesLeft.length > 0 ? `${gameState.movesLeft.length} hamle hakkın var` : '';
  };

  return (
    <VStack gap={3} align="center" w="full">
      {error && (
        <Alert.Root status="error" borderRadius="lg" maxW="600px" w="full">
          <Alert.Indicator />
          <Alert.Title fontSize="sm">{error}</Alert.Title>
        </Alert.Root>
      )}

      {/* Player info bar */}
      <HStack justify="space-between" w="full" maxW="720px" px={1}>
        <HStack gap={2}>
          <Box w="14px" h="14px" borderRadius="full" bg={myColor === 'white' ? '#e8e0d0' : '#2a1f1f'} borderWidth="1px" borderColor="border.subtle" />
          <Text fontSize="sm" fontWeight="700">{myInfo?.displayName ?? 'Sen'}</Text>
          <Text fontSize="xs" color="text.muted">({gameState.borneOff[myColor]}/15)</Text>
        </HStack>
        <Text fontSize="sm" color={isMyTurn ? 'green.400' : 'text.muted'} fontWeight="600">
          {statusMsg()}
        </Text>
        <HStack gap={2}>
          <Text fontSize="xs" color="text.muted">({gameState.borneOff[myColor === 'white' ? 'black' : 'white']}/15)</Text>
          <Text fontSize="sm" fontWeight="700">{oppInfo?.displayName ?? 'Rakip'}</Text>
          <Box w="14px" h="14px" borderRadius="full" bg={myColor === 'white' ? '#2a1f1f' : '#e8e0d0'} borderWidth="1px" borderColor="border.subtle" />
        </HStack>
      </HStack>

      {/* Board */}
      <Box
        w="full"
        maxW="720px"
        borderRadius="xl"
        overflow="hidden"
        borderWidth="2px"
        borderColor="border.subtle"
        boxShadow="0 8px 32px rgba(0,0,0,0.2)"
      >
        <TavlaBoard
          state={gameState}
          myColor={myColor}
          flip={flip}
          selected={selected}
          validMoves={validMoves}
          animDice={animDice}
          onPointClick={handlePointClick}
        />
      </Box>

      {/* Action buttons */}
      <HStack gap={3}>
        {isMyTurn && gameState.phase === 'rolling' && (
          <Button
            colorPalette="brand"
            variant="solid"
            size="lg"
            onClick={handleRoll}
            loading={isAnimating}
          >
            Zar At 🎲
          </Button>
        )}
        {gameState.phase !== 'ended' && (
          <Button variant="outline" colorPalette="red" size="sm" onClick={handleResign}>
            Teslim Ol
          </Button>
        )}
        {gameState.phase === 'ended' && (
          <Button
            variant="solid"
            colorPalette="brand"
            onClick={() => {
              sessionStorage.removeItem(STORAGE_KEY);
              setPhase('lobby');
              setGameState(null);
              setCreatedCode(null);
              setOpponentLeft(false);
              setSelected(null);
              setValidMoves([]);
              prevPhaseRef.current = null;
            }}
          >
            Yeni Oyun
          </Button>
        )}
      </HStack>
    </VStack>
  );
}
