'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { useRouter, Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { Box, Button, Heading, Text, HStack } from '@chakra-ui/react';

export default function EntryPage() {
  const t = useTranslations('entry');
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  if (!user) return null;

  return (
    <AppShell>
      <Box maxW="520px" mx="auto">
        <Heading size="xl" fontWeight="800" mb={2}>{t('title')}</Heading>
        <Text color="text.muted" mb={8}>{t('subtitle')}</Text>

        {/* Wordle */}
        <Box
          bg="surface.card"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="border.subtle"
          p={5}
          mb={4}
        >
          <HStack justify="space-between" align="center" gap={4} flexWrap="wrap">
            <Box>
              <Text fontWeight="700" fontSize="md">Wordle</Text>
              <Text fontSize="sm" color="text.muted">Wordle'ı sitede oynayıp skoru otomatik kaydet</Text>
            </Box>
            <Link href="/wordle">
              <Button colorPalette="green" size="sm" fontWeight="600">
                Wordle'ı Oyna →
              </Button>
            </Link>
          </HStack>
        </Box>

        {/* Parolla */}
        <Box
          bg="surface.card"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="border.subtle"
          p={5}
        >
          <HStack justify="space-between" align="center" gap={4} flexWrap="wrap">
            <Box>
              <Text fontWeight="700" fontSize="md">Parolla</Text>
              <Text fontSize="sm" color="text.muted">26 harf · 5 dakika · skoru otomatik kaydet</Text>
            </Box>
            <Link href="/parolla">
              <Button colorPalette="yellow" size="sm" fontWeight="600">
                Parolla'yı Oyna →
              </Button>
            </Link>
          </HStack>
        </Box>
      </Box>
    </AppShell>
  );
}
