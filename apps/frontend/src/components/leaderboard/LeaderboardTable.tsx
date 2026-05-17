'use client';

import { Table, Avatar, Badge, HStack, Text, Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';
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

function ScoreBar({ score, index }: { score: number; index: number }) {
  return (
    <HStack gap={2} justify="flex-end">
      <Box h="6px" w="60px" bg="border.subtle" borderRadius="full" overflow="hidden" display={{ base: 'none', sm: 'block' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 0.7, delay: 0.1 + index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ height: '100%', background: '#3a5fff', borderRadius: '9999px' }}
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
          {entries.map((entry, index) => {
            const rawDisplay = formatRawScore(entry, t('dnf'));
            return (
              <Table.Row
                key={entry.userId}
                style={{
                  animation: `ao-row-in 0.32s ease-out ${index * 0.05}s both`,
                }}
              >
                <Table.Cell>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05, type: 'spring', stiffness: 300 }}
                  >
                    <Text fontSize="md" fontWeight="700" color={entry.rank <= 3 ? 'brand.500' : 'text.muted'}>
                      {entry.rank}
                    </Text>
                  </motion.div>
                </Table.Cell>
                <Table.Cell maxW={{ base: '130px', sm: 'unset' }}>
                  <HStack gap={2}>
                    <Avatar.Root size="xs">
                      <Avatar.Fallback name={entry.displayName} />
                      {entry.avatarUrl && <Avatar.Image src={entry.avatarUrl} alt={entry.displayName} />}
                    </Avatar.Root>
                    <Text fontWeight="500" fontSize="sm" truncate>{entry.displayName}</Text>
                    {topScore !== null && entry.normalizedScore === topScore && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
                        style={{ flexShrink: 0 }}
                      >
                        <Badge colorPalette="yellow" size="sm" variant="subtle" display={{ base: 'none', sm: 'inline-flex' }}>{t('leader')}</Badge>
                      </motion.div>
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
                  <ScoreBar score={entry.normalizedScore} index={index} />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
