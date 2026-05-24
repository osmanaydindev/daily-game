'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { WordleGame } from '@/components/wordle/WordleGame';
import { getDailyWord } from '@/lib/wordleWords';
import { todayLocal } from '@/lib/date';
import { Box, Heading, Text, HStack, Spinner, VStack } from '@chakra-ui/react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/lib/navigation';
import { api } from '@/lib/api';

// ─── Tile evaluation (aynı WordleGame mantığı) ───────────────────────────────
type TileStatus = 'correct' | 'present' | 'absent' | 'empty';

function evaluateGuess(guess: string, target: string): TileStatus[] {
  const result: TileStatus[] = Array(5).fill('absent');
  const targetArr = target.split('');
  const guessArr  = guess.split('');
  const used      = Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) { result[i] = 'correct'; used[i] = true; }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guessArr[i] === targetArr[j]) { result[i] = 'present'; used[j] = true; break; }
    }
  }
  return result;
}

const TILE_BG: Record<TileStatus, string> = {
  correct: '#538d4e',
  present: '#b59f3b',
  absent:  '#3a3a3c',
  empty:   '#2a2a2c',
};

// ─── Completed card ───────────────────────────────────────────────────────────
function WordleCompletedCard({
  attempt,
  guesses,
  target,
}: {
  attempt: number;
  guesses: string[];
  target: string;
}) {
  const today = todayLocal();
  const isDNF = attempt === 7;
  const label = isDNF ? 'DNF' : `${attempt}/6`;
  const hasRealGuesses = guesses.length > 0;

  return (
    <Box
      bg="surface.card"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.subtle"
      p={8}
      maxW="360px"
      mx="auto"
      textAlign="center"
      boxShadow="0 8px 32px rgba(0,0,0,0.12)"
    >
      {/* Tile grid */}
      <VStack gap={1.5} mb={6} align="center">
        {Array.from({ length: 6 }, (_, rowIdx) => {
          const guess = guesses[rowIdx];
          const statuses = guess ? evaluateGuess(guess, target) : null;
          const isEmpty = !guess;

          return (
            <HStack key={rowIdx} gap={1.5} justify="center">
              {Array.from({ length: 5 }, (_, colIdx) => {
                const letter   = guess?.[colIdx] ?? '';
                const bg       = statuses ? TILE_BG[statuses[colIdx]] : TILE_BG.empty;
                const opacity  = isEmpty ? 0.15 : 1;
                return (
                  <Box
                    key={colIdx}
                    w={{ base: '44px', md: '52px' }}
                    h={{ base: '44px', md: '52px' }}
                    borderRadius="4px"
                    bg={bg}
                    opacity={opacity}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize={{ base: 'lg', md: 'xl' }}
                    fontWeight="800"
                    color="white"
                  >
                    {hasRealGuesses ? letter : ''}
                  </Box>
                );
              })}
            </HStack>
          );
        })}
      </VStack>

      <Text fontSize="xs" fontWeight="700" letterSpacing="widest" color="text.muted" mb={1} textTransform="uppercase">
        Wordle — {today}
      </Text>

      <Text fontSize="4xl" fontWeight="900" letterSpacing="-1px" color={isDNF ? 'red.400' : 'green.400'} mb={2}>
        {label}
      </Text>

      {/* Kelime her zaman göster */}
      <Text fontSize="sm" color="text.muted" mb={3}>
        Kelime:{' '}
        <Text as="span" fontWeight="800" color={isDNF ? 'red.400' : 'green.400'}>
          {target}
        </Text>
      </Text>

      <Text fontSize="sm" color="text.muted">
        {isDNF ? 'Bugün olmadı, yarın tekrar!' : 'Tebrikler! Yarın yeni kelimeyle görüşürüz.'}
      </Text>
    </Box>
  );
}

export default function WordlePage() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const word   = getDailyWord();
  const today  = todayLocal();

  const [checking,    setChecking]    = useState(true);
  const [entry,       setEntry]       = useState<{ attempt: number } | null>(null);
  const [localGuesses, setLocalGuesses] = useState<string[]>([]);

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (!user) return;
    // localStorage'dan gerçek tahminleri oku
    try {
      const raw = localStorage.getItem(`wordle-state-${user._id}`);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.date === today && Array.isArray(saved.guesses)) {
          setLocalGuesses(saved.guesses);
        }
      }
    } catch { /* ignore */ }

    api.get('/entries', { params: { gameSlug: 'wordle', from: today, to: today } })
      .then((res) => {
        const entries = res.data?.data ?? [];
        if (entries.length > 0) setEntry({ attempt: entries[0].scores.attempt });
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [user, today]);

  if (!user || checking) {
    return (
      <AppShell>
        <Box display="flex" justifyContent="center" pt={20}>
          <Spinner />
        </Box>
      </AppShell>
    );
  }

  if (entry) {
    return (
      <AppShell>
        <Box maxW="400px" mx="auto" pt={10} px={4} pb={10}>
          <WordleCompletedCard attempt={entry.attempt} guesses={localGuesses} target={word} />
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Box maxW="540px" mx="auto">
        <Box textAlign="center" mb={6}>
          <Heading size="xl" fontWeight="800" mb={1}>Wordle</Heading>
          <HStack justify="center" gap={3}>
            <Text fontSize="sm" color="text.muted" fontFamily="mono">{today}</Text>
            <Text fontSize="xs" color="text.muted">·</Text>
            <Text fontSize="xs" color="text.muted">{word.length} harf · maks 6 tahmin</Text>
          </HStack>
        </Box>

        <WordleGame />
      </Box>
    </AppShell>
  );
}
