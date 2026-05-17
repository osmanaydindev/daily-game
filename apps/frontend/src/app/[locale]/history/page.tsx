'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/lib/navigation';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Box,
  Heading,
  Text,
  HStack,
  Badge,
  Select,
  Table,
  createListCollection,
} from '@chakra-ui/react';
import type { DailyEntryPublic } from '@dail-game/types';

function formatScore(entry: DailyEntryPublic): string {
  const s = entry.scores as any;
  if (entry.gameSlug === 'wordle') {
    return s.attempt === 7 ? 'DNF' : `${s.attempt}/6`;
  }
  if (entry.gameSlug === 'parolla') {
    return `${s.correct}✓ ${s.wrong}✗ ${s.blank}○`;
  }
  return JSON.stringify(s);
}

export default function HistoryPage() {
  const t = useTranslations('history');
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const [entries, setEntries] = useState<DailyEntryPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState('');

  const gameCollection = createListCollection({
    items: [
      { label: t('allGames'), value: '' },
      { label: 'Wordle', value: 'wordle' },
      { label: 'Parolla', value: 'parolla' },
    ],
  });

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (gameFilter) params.set('gameSlug', gameFilter);
    api.get<{ data: DailyEntryPublic[] }>(`/entries?${params.toString()}`)
      .then((res) => setEntries(res.data.data ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [user, gameFilter]);

  if (!user) return null;

  return (
    <AppShell>
      <Heading size="xl" fontWeight="800" mb={2}>
        {t('title')}
      </Heading>
      <Text color="text.muted" mb={6}>
        {t('subtitle')}
      </Text>

      <HStack mb={6} gap={3} wrap="wrap">
        <Select.Root
          collection={gameCollection}
          value={[gameFilter]}
          onValueChange={(e) => setGameFilter(e.value[0] ?? '')}
          maxW="200px"
        >
          <Select.Trigger>
            <Select.ValueText placeholder={t('allGames')} />
          </Select.Trigger>
          <Select.Content>
            {gameCollection.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </HStack>

      {loading && <LoadingState />}
      {!loading && entries.length === 0 && (
        <EmptyState title={t('noEntries')} description={t('noEntriesDesc')} />
      )}
      {!loading && entries.length > 0 && (
        <Box bg="surface.card" borderRadius="xl" borderWidth="1px" borderColor="border.subtle" overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t('date')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('game')}</Table.ColumnHeader>
                <Table.ColumnHeader display={{ base: 'none', sm: 'table-cell' }}>{t('result')}</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">{t('score')}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {entries.map((entry) => (
                <Table.Row key={entry._id}>
                  <Table.Cell fontFamily="mono" fontSize="sm" whiteSpace="nowrap">{entry.date}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      colorPalette={entry.gameSlug === 'wordle' ? 'green' : 'blue'}
                      variant="subtle"
                      size="sm"
                    >
                      {entry.gameSlug === 'wordle' ? 'Wordle' : 'Parolla'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell fontFamily="mono" fontSize="sm" display={{ base: 'none', sm: 'table-cell' }}>{formatScore(entry)}</Table.Cell>
                  <Table.Cell textAlign="right">
                    <Text fontFamily="mono" fontSize="sm" fontWeight="600">
                      {(entry.normalizedScore * 100).toFixed(1)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </AppShell>
  );
}
