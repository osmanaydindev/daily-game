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

const TILE_COLORS = ['#538d4e', '#b59f3b', '#3a3a3c', '#538d4e', '#b59f3b'];

function WordleCompletedCard({ attempt }: { attempt: number }) {
  const today = todayLocal();
  const isDNF = attempt === 7;
  const label = isDNF ? 'DNF' : `${attempt}/6`;

  const rows = Array.from({ length: 6 }, (_, i) => {
    const isGuessed = i < (isDNF ? 6 : attempt);
    return Array.from({ length: 5 }, (_, j) => {
      if (!isGuessed) return '#2a2a2c';
      if (i === (isDNF ? 5 : attempt - 1) && !isDNF) return '#538d4e';
      return TILE_COLORS[(i * 3 + j) % TILE_COLORS.length];
    });
  });

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
      {/* Mini tile grid */}
      <VStack gap={1} mb={6} align="center">
        {rows.map((row, ri) => (
          <HStack key={ri} gap={1} justify="center">
            {row.map((color, ci) => (
              <Box
                key={ci}
                w="28px"
                h="28px"
                borderRadius="4px"
                bg={color}
                opacity={ri < (isDNF ? 6 : attempt) ? 1 : 0.15}
              />
            ))}
          </HStack>
        ))}
      </VStack>

      <Text fontSize="xs" fontWeight="700" letterSpacing="widest" color="text.muted" mb={1} textTransform="uppercase">
        Wordle — {today}
      </Text>

      <Text fontSize="4xl" fontWeight="900" letterSpacing="-1px" color={isDNF ? 'red.400' : 'green.400'} mb={1}>
        {label}
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

  const [checking, setChecking] = useState(true);
  const [entry, setEntry] = useState<{ attempt: number } | null>(null);

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (!user) return;
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
        <Box maxW="540px" mx="auto" pt={10}>
          <WordleCompletedCard attempt={entry.attempt} />
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
