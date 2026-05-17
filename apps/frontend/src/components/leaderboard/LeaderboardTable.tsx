'use client';

import { Table, Avatar, Badge, HStack, Text, Box } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import type { LeaderboardEntry, WordleScores, ParollaScores } from '@dail-game/types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  title: string;
  scoreLabel?: string;
}

function formatRawScore(entry: LeaderboardEntry, dnfLabel: string): string | null {
  if (!entry.rawScores || !entry.gameSlug) return null;
  if (entry.gameSlug === 'wordle') {
    const s = entry.rawScores as WordleScores;
    return s.attempt === 7 ? dnfLabel : `${s.attempt}/6`;
  }
  if (entry.gameSlug === 'parolla') {
    const s = entry.rawScores as ParollaScores;
    return `${s.correct}✓  ${s.wrong}✗  ${s.blank}○`;
  }
  return null;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <HStack gap={2} justify="flex-end">
      <Box h="6px" w="60px" bg="border.subtle" borderRadius="full" overflow="hidden" display={{ base: 'none', sm: 'block' }}>
        <Box
          h="full"
          bg="brand.500"
          borderRadius="full"
          style={{ width: `${score * 100}%`, transition: 'width 0.5s ease' }}
        />
      </Box>
      <Text fontSize="sm" fontWeight="600" fontFamily="mono" textAlign="right">
        {(score * 100).toFixed(1)}
      </Text>
    </HStack>
  );
}

export function LeaderboardTable({ entries, title, scoreLabel }: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');
  const tCommon = useTranslations('common');
  const label = scoreLabel ?? tCommon('score');
  const topScore = entries.length > 0 ? entries[0].normalizedScore : null;

  return (
    <Box bg="surface.card" borderRadius="xl" borderWidth="1px" borderColor="border.subtle" overflow="hidden">
      <Box px={5} py={4} borderBottomWidth="1px" borderColor="border.subtle">
        <Text fontWeight="700" fontSize="lg">{title}</Text>
      </Box>

      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="40px">#</Table.ColumnHeader>
            <Table.ColumnHeader>{tCommon('player')}</Table.ColumnHeader>
            <Table.ColumnHeader display={{ base: 'none', sm: 'table-cell' }}>{tCommon('result')}</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="right">{label}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {entries.map((entry) => {
            const rawDisplay = formatRawScore(entry, t('dnf'));
            return (
              <Table.Row key={entry.userId}>
                <Table.Cell>
                  <Text fontSize="md" fontWeight="700" color={entry.rank <= 3 ? 'brand.500' : 'text.muted'}>
                    {entry.rank}
                  </Text>
                </Table.Cell>
                <Table.Cell maxW={{ base: '130px', sm: 'unset' }}>
                  <HStack gap={2}>
                    <Avatar.Root size="xs">
                      <Avatar.Fallback name={entry.displayName} />
                      {entry.avatarUrl && <Avatar.Image src={entry.avatarUrl} alt={entry.displayName} />}
                    </Avatar.Root>
                    <Box>
                      <Text fontWeight="600" fontSize="sm" truncate>@{entry.username}</Text>
                      <Text fontSize="xs" color="text.muted" truncate>{entry.displayName}</Text>
                    </Box>
                    {topScore !== null && entry.normalizedScore === topScore && (
                      <Badge colorPalette="yellow" size="sm" variant="subtle" display={{ base: 'none', sm: 'inline-flex' }} flexShrink={0}>
                        {t('leader')}
                      </Badge>
                    )}
                  </HStack>
                </Table.Cell>
                <Table.Cell display={{ base: 'none', sm: 'table-cell' }}>
                  {rawDisplay ? (
                    <Text fontFamily="mono" fontSize="sm" color="text.muted">{rawDisplay}</Text>
                  ) : (
                    <Text color="text.muted" fontSize="xs">—</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <ScoreBar score={entry.normalizedScore} />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
