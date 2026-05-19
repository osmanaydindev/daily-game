'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, VStack, HStack, Text, Button, Alert,
} from '@chakra-ui/react';
import { api } from '@/lib/api';
import { todayLocal } from '@/lib/date';
import { getDailyWord, VALID_LETTERS, loadValidWords, isValidGuess } from '@/lib/wordleWords';
import { useAuthStore } from '@/store/authStore';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@dail-game/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type TileStatus = 'empty' | 'tbd' | 'correct' | 'present' | 'absent';
type KeyStatus  = 'correct' | 'present' | 'absent' | 'unused';
type GameStatus = 'playing' | 'won' | 'lost';

interface SavedState {
  date: string;
  guesses: string[];
  status: GameStatus;
  submitted: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_GUESSES = 6;
const WORD_LENGTH  = 5;
const STORAGE_KEY  = 'wordle-state';

const KEYBOARD_ROWS = [
  ['E', 'R', 'T', 'Y', 'U', 'İ', 'O', 'P', 'Ğ', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'I'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç', '⌫'],
];

// ─── Game logic ───────────────────────────────────────────────────────────────
function evaluateGuess(guess: string, target: string): TileStatus[] {
  const result: TileStatus[] = Array(WORD_LENGTH).fill('absent');
  const targetArr = target.split('');
  const guessArr  = guess.split('');
  const used      = Array(WORD_LENGTH).fill(false);

  // Pass 1: exact matches
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      used[i]   = true;
    }
  }

  // Pass 2: present elsewhere
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!used[j] && guessArr[i] === targetArr[j]) {
        result[i] = 'present';
        used[j]   = true;
        break;
      }
    }
  }

  return result;
}

function buildKeyStatuses(guesses: string[], target: string): Record<string, KeyStatus> {
  const map: Record<string, KeyStatus> = {};
  for (const guess of guesses) {
    const evals = evaluateGuess(guess, target);
    guess.split('').forEach((ch, i) => {
      const prev = map[ch];
      const next = evals[i];
      if (next === 'correct') map[ch] = 'correct';
      else if (next === 'present' && prev !== 'correct') map[ch] = 'present';
      else if (!prev) map[ch] = 'absent';
    });
  }
  return map;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const TILE_BG: Record<TileStatus, string> = {
  empty:   'transparent',
  tbd:     'transparent',
  correct: '#538d4e',
  present: '#b59f3b',
  absent:  '#3a3a3c',
};
const TILE_BORDER: Record<TileStatus, string> = {
  empty:   'var(--chakra-colors-border-subtle)',
  tbd:     'var(--chakra-colors-border-emphasized)',
  correct: '#538d4e',
  present: '#b59f3b',
  absent:  '#3a3a3c',
};

function Tile({ letter, status }: { letter: string; status: TileStatus }) {
  return (
    <Box
      w={{ base: '52px', md: '60px' }}
      h={{ base: '52px', md: '60px' }}
      border="2px solid"
      borderColor={TILE_BORDER[status]}
      bg={TILE_BG[status]}
      color={status === 'empty' || status === 'tbd' ? undefined : 'white'}
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontSize={{ base: 'xl', md: '2xl' }}
      fontWeight="800"
      borderRadius="4px"
      userSelect="none"
      transition="background 0.15s, border-color 0.15s"
    >
      {letter}
    </Box>
  );
}

const KEY_BG: Record<KeyStatus, string> = {
  correct: '#538d4e',
  present: '#b59f3b',
  absent:  '#3a3a3c',
  unused:  '',
};

function KeyboardKey({
  label,
  keyStatus,
  onPress,
}: {
  label: string;
  keyStatus: KeyStatus;
  onPress: () => void;
}) {
  const isAction = label === 'ENTER' || label === '⌫';
  const colored  = keyStatus !== 'unused';

  return (
    <Box
      as="button"
      onClick={onPress}
      display="flex"
      alignItems="center"
      justifyContent="center"
      h="58px"
      minW={isAction ? '52px' : '36px'}
      px={isAction ? 1 : 0}
      fontSize={isAction ? '10px' : 'sm'}
      fontWeight="700"
      borderRadius="6px"
      bg={colored ? KEY_BG[keyStatus] : 'surface.card'}
      color={colored ? 'white' : undefined}
      border="1px solid"
      borderColor="border.subtle"
      cursor="pointer"
      userSelect="none"
      _hover={{ opacity: 0.8 }}
      _active={{ opacity: 0.6 }}
      transition="opacity 0.1s"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {label}
    </Box>
  );
}

// ─── Result summary (share-style) ────────────────────────────────────────────
function ResultSummary({ guesses, target, status }: { guesses: string[]; target: string; status: GameStatus }) {
  const emoji = (s: TileStatus) =>
    s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛';

  return (
    <VStack gap={1} fontFamily="mono" fontSize="sm">
      {guesses.map((g, i) => (
        <Text key={i} letterSpacing="wider">
          {evaluateGuess(g, target).map(emoji).join('')}
        </Text>
      ))}
      {status === 'lost' && (
        <Text fontSize="xs" color="text.muted" mt={1}>Kelime: <strong>{target}</strong></Text>
      )}
    </VStack>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function WordleGame() {
  const { user } = useAuthStore();
  const target = getDailyWord();
  const today  = todayLocal();

  const [guesses,     setGuesses]     = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [status,      setStatus]      = useState<GameStatus>('playing');
  const [submitted,   setSubmitted]   = useState(false);
  const [submitMsg,   setSubmitMsg]   = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [ready,       setReady]       = useState(false);

  // ── Preload valid words dictionary ────────────────────────────────────────
  useEffect(() => { loadValidWords(); }, []);

  // ── Load persisted state ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedState = JSON.parse(raw);
        if (saved.date === today) {
          setGuesses(saved.guesses);
          setStatus(saved.status);
          setSubmitted(saved.submitted);
        }
      }
    } catch { /* ignore */ }
    setReady(true);
  }, [today]);

  // ── Persist on change ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const saved: SavedState = { date: today, guesses, status, submitted };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [ready, today, guesses, status, submitted]);

  // ── Auto-submit when game ends ────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    if (submitted) return;
    if (status === 'playing') return;
    if (!user) {
      setSubmitMsg('Skoru kaydetmek için giriş yapın.');
      return;
    }

    const attempt = status === 'won' ? guesses.length : 7;
    api.post('/entries', { gameSlug: 'wordle', scores: { attempt } })
      .then(() => {
        setSubmitted(true);
        setSubmitMsg(`Skor kaydedildi — ${attempt === 7 ? 'DNF' : `${attempt}/6`}`);
      })
      .catch((err: AxiosError<ApiResponse>) => {
        if (err.response?.status === 409) {
          setSubmitted(true);
          setSubmitMsg('Bugün zaten kayıt yapılmış.');
        } else {
          setSubmitMsg('Skor kaydedilemedi.');
        }
      });
  }, [ready, status, submitted, user, guesses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Input handlers ────────────────────────────────────────────────────────
  const addLetter = useCallback((letter: string) => {
    if (status !== 'playing') return;
    if (currentInput.length >= WORD_LENGTH) return;
    setError(null);
    setCurrentInput(prev => prev + letter);
  }, [status, currentInput.length]);

  const deleteLetter = useCallback(() => {
    if (status !== 'playing') return;
    setCurrentInput(prev => prev.slice(0, -1));
  }, [status]);

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return;
    if (currentInput.length < WORD_LENGTH) {
      setError('5 harf girmelisiniz.');
      return;
    }
    if (!isValidGuess(currentInput)) {
      setError('Kelime bulunamadı.');
      return;
    }
    setError(null);

    const newGuesses = [...guesses, currentInput];
    setGuesses(newGuesses);
    setCurrentInput('');

    if (currentInput === target) {
      setStatus('won');
    } else if (newGuesses.length >= MAX_GUESSES) {
      setStatus('lost');
    }
  }, [status, currentInput, guesses, target]);

  // ── Physical keyboard ─────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter')     { submitGuess(); return; }
      if (e.key === 'Backspace') { deleteLetter(); return; }
      if (e.key.length === 1) {
        const upper = e.key.toLocaleUpperCase('tr-TR');
        if (VALID_LETTERS.has(upper)) addLetter(upper);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [addLetter, deleteLetter, submitGuess]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const keyStatuses = buildKeyStatuses(guesses, target);

  if (!ready) return null;

  return (
    <VStack gap={4} align="center" w="full">

      {/* Board */}
      <VStack gap={1.5}>
        {Array.from({ length: MAX_GUESSES }, (_, rowIdx) => {
          const completedGuess = guesses[rowIdx];
          const isCurrent = rowIdx === guesses.length && status === 'playing';

          return (
            <HStack key={rowIdx} gap={1.5}>
              {Array.from({ length: WORD_LENGTH }, (_, colIdx) => {
                let letter = '';
                let tileStatus: TileStatus = 'empty';

                if (completedGuess) {
                  letter     = completedGuess[colIdx];
                  tileStatus = evaluateGuess(completedGuess, target)[colIdx];
                } else if (isCurrent) {
                  letter     = currentInput[colIdx] ?? '';
                  tileStatus = letter ? 'tbd' : 'empty';
                }

                return <Tile key={colIdx} letter={letter} status={tileStatus} />;
              })}
            </HStack>
          );
        })}
      </VStack>

      {/* Error */}
      {error && (
        <Text fontSize="sm" color="red.400" fontWeight="600">{error}</Text>
      )}

      {/* Game over */}
      {status !== 'playing' && (
        <Box
          bg="surface.card"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.subtle"
          p={5}
          textAlign="center"
          w="full"
          maxW="340px"
        >
          <Text fontWeight="800" fontSize="lg" mb={3}>
            {status === 'won' ? '🎉 Tebrikler!' : '😔 Kaybettiniz'}
          </Text>
          <ResultSummary guesses={guesses} target={target} status={status} />
          {submitMsg && (
            <Alert.Root
              status={submitMsg.includes('kaydedildi') ? 'success' : 'info'}
              borderRadius="lg"
              mt={4}
              size="sm"
            >
              <Alert.Indicator />
              <Alert.Title fontSize="xs">{submitMsg}</Alert.Title>
            </Alert.Root>
          )}
        </Box>
      )}

      {/* Keyboard */}
      <Box w="full" maxW="500px" pt={2}>
        <VStack gap={1.5}>
          {KEYBOARD_ROWS.map((row, ri) => (
            <HStack key={ri} gap={1} justify="center" flexWrap="nowrap">
              {row.map((key) => (
                <KeyboardKey
                  key={key}
                  label={key}
                  keyStatus={key === 'ENTER' || key === '⌫' ? 'unused' : (keyStatuses[key] ?? 'unused')}
                  onPress={() => {
                    if (key === 'ENTER') submitGuess();
                    else if (key === '⌫') deleteLetter();
                    else addLetter(key);
                  }}
                />
              ))}
            </HStack>
          ))}
        </VStack>
      </Box>

    </VStack>
  );
}
