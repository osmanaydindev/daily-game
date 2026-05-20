'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ParollaGame } from '@/components/parolla/ParollaGame';
import { Box, Heading, Text } from '@chakra-ui/react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/lib/navigation';

export default function ParollaPage() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  if (!user) return null;

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
