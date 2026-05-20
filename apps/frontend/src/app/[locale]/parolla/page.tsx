'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ParollaGame } from '@/components/parolla/ParollaGame';
import { Box, Heading, Text, Spinner, VStack, HStack } from '@chakra-ui/react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/lib/navigation';
import { api } from '@/lib/api';
import { todayLocal } from '@/lib/date';

interface ParollaScores { correct: number; wrong: number; blank: number; }

function ParollaCompletedCard({ scores }: { scores: ParollaScores }) {
  const today = todayLocal();
  const { correct, wrong, blank } = scores;
  const total = correct + wrong + blank;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const stats = [
    { label: 'Doğru',  value: correct, color: '#538d4e' },
    { label: 'Yanlış', value: wrong,   color: '#c0392b' },
    { label: 'Boş',    value: blank,   color: '#3a3a3c' },
  ];

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
      {/* Arc / score ring visual */}
      <Box position="relative" w="120px" h="120px" mx="auto" mb={6}>
        <svg viewBox="0 0 120 120" width="120" height="120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--chakra-colors-border-subtle)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            stroke="#538d4e"
            strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <Box position="absolute" inset={0} display="flex" flexDir="column" alignItems="center" justifyContent="center">
          <Text fontSize="2xl" fontWeight="900" lineHeight="1">{pct}%</Text>
          <Text fontSize="xs" color="text.muted">doğru</Text>
        </Box>
      </Box>

      <Text fontSize="xs" fontWeight="700" letterSpacing="widest" color="text.muted" mb={4} textTransform="uppercase">
        Parolla — {today}
      </Text>

      {/* Stat bars */}
      <VStack gap={2} mb={5} align="stretch">
        {stats.map(({ label, value, color }) => (
          <HStack key={label} justify="space-between" align="center">
            <HStack gap={2}>
              <Box w="10px" h="10px" borderRadius="full" bg={color} flexShrink={0} />
              <Text fontSize="sm" color="text.muted">{label}</Text>
            </HStack>
            <HStack gap={2} align="center">
              <Box
                h="6px"
                borderRadius="full"
                bg={color}
                w={total > 0 ? `${Math.round((value / total) * 80)}px` : '0px'}
                minW={value > 0 ? '6px' : '0'}
                opacity={0.8}
              />
              <Text fontSize="sm" fontWeight="700" w="20px" textAlign="right">{value}</Text>
            </HStack>
          </HStack>
        ))}
      </VStack>

      <Text fontSize="sm" color="text.muted">
        {pct >= 80 ? 'Harika bir gün! Yarın tekrar görüşürüz.' : pct >= 50 ? 'Fena değil! Yarın daha iyisini yaparsın.' : 'Yarın daha iyi olacak!'}
      </Text>
    </Box>
  );
}

export default function ParollaPage() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const today  = todayLocal();

  const [checking, setChecking] = useState(true);
  const [entry, setEntry] = useState<ParollaScores | null>(null);

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/entries', { params: { gameSlug: 'parolla', from: today, to: today } })
      .then((res) => {
        const entries = res.data?.data ?? [];
        if (entries.length > 0) setEntry(entries[0].scores as ParollaScores);
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
        <Box maxW="600px" mx="auto" pt={10}>
          <ParollaCompletedCard scores={entry} />
        </Box>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Box maxW="600px" mx="auto">
        <Box textAlign="center" mb={6}>
          <Heading size="xl" fontWeight="800" mb={1}>Parolla</Heading>
          <Text fontSize="sm" color="text.muted">
            26 harf · 5 dakika · günde bir kez
          </Text>
        </Box>
        <ParollaGame />
      </Box>
    </AppShell>
  );
}
