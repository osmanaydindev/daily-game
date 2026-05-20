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

export default function WordlePage() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const word   = getDailyWord();
  const today  = todayLocal();

  const [checking, setChecking] = useState(true);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/entries', { params: { gameSlug: 'wordle', from: today, to: today } })
      .then((res) => {
        const entries = res.data?.data ?? [];
        setAlreadyPlayed(entries.length > 0);
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

  if (alreadyPlayed) {
    return (
      <AppShell>
        <Box maxW="540px" mx="auto" textAlign="center" pt={16}>
          <Text fontSize="4xl" mb={4}>✅</Text>
          <Heading size="lg" fontWeight="800" mb={2}>Bugünkü Wordle tamamlandı</Heading>
          <Text color="text.muted" fontSize="sm">Yarın yeni bir kelimeyle tekrar gel!</Text>
          <VStack mt={6} gap={2}>
            <Text fontSize="sm" color="text.muted" fontFamily="mono">{today}</Text>
          </VStack>
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
