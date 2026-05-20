'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ParollaGame } from '@/components/parolla/ParollaGame';
import { Box, Heading, Text, Spinner, VStack } from '@chakra-ui/react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/lib/navigation';
import { api } from '@/lib/api';
import { todayLocal } from '@/lib/date';

export default function ParollaPage() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const today  = todayLocal();

  const [checking, setChecking] = useState(true);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/entries', { params: { gameSlug: 'parolla', from: today, to: today } })
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
        <Box maxW="600px" mx="auto" textAlign="center" pt={16}>
          <Text fontSize="4xl" mb={4}>✅</Text>
          <Heading size="lg" fontWeight="800" mb={2}>Bugünkü Parolla tamamlandı</Heading>
          <Text color="text.muted" fontSize="sm">Yarın yeni sorularla tekrar gel!</Text>
          <VStack mt={6} gap={2}>
            <Text fontSize="sm" color="text.muted" fontFamily="mono">{today}</Text>
          </VStack>
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
