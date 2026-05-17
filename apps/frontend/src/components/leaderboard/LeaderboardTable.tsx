'use client';

import { useState } from 'react';
import {
  Table, Avatar, Badge, HStack, Text, Box,
  Dialog, VStack, Separator, Button,
} from '@chakra-ui/react';
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
    <HStack gap={2} justify="flex-end" flexShrink={0}>
      <Box h="6px" w="44px" bg="border.subtle" borderRadius="full" overflow="hidden" display={{ base: 'none', md: 'block' }}>
        <Box
          h="full"
          bg="brand.500"
          borderRadius="full"
          style={{ width: `${score * 100}%`, transition: 'width 0.5s ease' }}
        />
      </Box>
      <Text fontSize="sm" fontWeight="600" fontFamily="mono" minW="36px" textAlign="right">
        {(score * 100).toFixed(1)}
      </Text>
    </HStack>
  );
}

// ─── Player detail modal ───────────────────────────────────────────────────────
function PlayerModal({
  entry,
  open,
  onClose,
  dnfLabel,
  scoreLabel,
}: {
  entry: LeaderboardEntry;
  open: boolean;
  onClose: () => void;
  dnfLabel: string;
  scoreLabel: string;
}) {
  const rawDisplay = formatRawScore(entry, dnfLabel);

  return (
    <Dialog.Root open={open} onOpenChange={(e) => { if (!e.open) onClose(); }} placement="center" motionPreset="slide-in-bottom">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content borderRadius="2xl" mx={4} maxW="360px">
          <Dialog.Header pt={6} pb={0} px={6}>
            <HStack gap={4}>
              <Avatar.Root size="xl">
                <Avatar.Fallback name={entry.displayName} />
                {entry.avatarUrl && <Avatar.Image src={entry.avatarUrl} alt={entry.displayName} />}
              </Avatar.Root>
              <Box overflow="hidden">
                <Text fontWeight="700" fontSize="lg" truncate>@{entry.username}</Text>
                <Text fontSize="sm" color="text.muted" truncate>{entry.displayName}</Text>
              </Box>
            </HStack>
          </Dialog.Header>

          <Dialog.Body px={6} py={5}>
            <Separator mb={5} />
            <VStack gap={4} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.muted">Sıra</Text>
                <Text fontWeight="700" fontSize="lg" color={entry.rank <= 3 ? 'brand.500' : undefined}>
                  #{entry.rank}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="text.muted">{scoreLabel}</Text>
                <Text fontWeight="700" fontFamily="mono">
                  {(entry.normalizedScore * 100).toFixed(2)}
                </Text>
              </HStack>
              {rawDisplay && (
                <HStack justify="space-between">
                  <Text fontSize="sm" color="text.muted">Sonuç</Text>
                  <Text fontFamily="mono" fontSize="sm">{rawDisplay}</Text>
                </HStack>
              )}
            </VStack>
          </Dialog.Body>

          <Dialog.Footer pb={6} px={6}>
            <Button variant="outline" w="full" onClick={onClose}>
              Kapat
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function LeaderboardTable({ entries, title, scoreLabel }: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');
  const tCommon = useTranslations('common');
  const label = scoreLabel ?? tCommon('score');
  const topScore = entries.length > 0 ? entries[0].normalizedScore : null;

  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);

  return (
    <>
      <Box bg="surface.card" borderRadius="xl" borderWidth="1px" borderColor="border.subtle" overflow="hidden" minW={0}>
        <Box px={4} py={3} borderBottomWidth="1px" borderColor="border.subtle">
          <Text fontWeight="700" fontSize="md">{title}</Text>
        </Box>

        <Table.Root size="sm" style={{ tableLayout: 'fixed', width: '100%' }}>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader w="32px" px={2}>#</Table.ColumnHeader>
              <Table.ColumnHeader px={2}>{tCommon('player')}</Table.ColumnHeader>
              <Table.ColumnHeader display={{ base: 'none', lg: 'table-cell' }} px={2} w="70px">{tCommon('result')}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right" px={2} w="60px">{label}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {entries.map((entry) => {
              const rawDisplay = formatRawScore(entry, t('dnf'));
              return (
                <Table.Row
                  key={entry.userId}
                  cursor="pointer"
                  onClick={() => setSelected(entry)}
                  _hover={{ bg: 'surface' }}
                >
                  <Table.Cell px={2}>
                    <Text fontSize="sm" fontWeight="700" color={entry.rank <= 3 ? 'brand.500' : 'text.muted'}>
                      {entry.rank}
                    </Text>
                  </Table.Cell>
                  <Table.Cell px={2} style={{ overflow: 'hidden' }}>
                    <HStack gap={2} overflow="hidden" minW={0}>
                      <Avatar.Root size="xs" flexShrink={0}>
                        <Avatar.Fallback name={entry.displayName} />
                        {entry.avatarUrl && <Avatar.Image src={entry.avatarUrl} alt={entry.displayName} />}
                      </Avatar.Root>
                      <Box overflow="hidden" minW={0} flex={1}>
                        <Text fontWeight="600" fontSize="xs" truncate>@{entry.username}</Text>
                        <Text fontSize="xs" color="text.muted" truncate>{entry.displayName}</Text>
                      </Box>
                      {topScore !== null && entry.normalizedScore === topScore && (
                        <Badge colorPalette="yellow" size="sm" variant="subtle" flexShrink={0} display={{ base: 'none', sm: 'inline-flex' }}>
                          {t('leader')}
                        </Badge>
                      )}
                    </HStack>
                  </Table.Cell>
                  <Table.Cell display={{ base: 'none', lg: 'table-cell' }} px={2}>
                    {rawDisplay ? (
                      <Text fontFamily="mono" fontSize="xs" color="text.muted" truncate>{rawDisplay}</Text>
                    ) : (
                      <Text color="text.muted" fontSize="xs">—</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell px={2}>
                    <ScoreBar score={entry.normalizedScore} />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      {selected && (
        <PlayerModal
          entry={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          dnfLabel={t('dnf')}
          scoreLabel={label}
        />
      )}
    </>
  );
}
