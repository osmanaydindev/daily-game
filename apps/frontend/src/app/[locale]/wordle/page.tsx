'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { WordleGame } from '@/components/wordle/WordleGame';
import { getDailyWord } from '@/lib/wordleWords';
import { todayLocal } from '@/lib/date';
import { Box, Heading, Text, HStack, Link } from '@chakra-ui/react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/lib/navigation';

export default function WordlePage() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const word   = getDailyWord();
  const today  = todayLocal();

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  if (!user) return null;

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

        <Box textAlign="center" mt={6}>
          <Link href="/entry" fontSize="xs" color="text.muted">
            Manuel skor girişi →
          </Link>
        </Box>
      </Box>
    </AppShell>
  );
}
