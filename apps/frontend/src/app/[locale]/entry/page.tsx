'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { useRouter, Link } from '@/lib/navigation';
import { api } from '@/lib/api';
import { todayLocal } from '@/lib/date';
import { useTranslations } from 'next-intl';
import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  Text,
  VStack,
  Alert,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@dail-game/types';

// ─── Parolla form ─────────────────────────────────────────────────────────────
const parollaSchema = z.object({
  correct: z.coerce.number().int().min(0).max(26),
  wrong: z.coerce.number().int().min(0),
  blank: z.coerce.number().int().min(0),
}).refine((d) => d.correct + d.wrong + d.blank > 0, {
  message: 'En az bir alan sıfırdan farklı olmalı',
});
type ParollaValues = z.infer<typeof parollaSchema>;

function ParollaForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations('entry');
  const { register, handleSubmit, formState: { errors }, setError } = useForm<ParollaValues>({
    resolver: zodResolver(parollaSchema),
    defaultValues: { correct: 0, wrong: 0, blank: 0 },
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: ParollaValues) => {
    setLoading(true);
    try {
      await api.post('/entries', { gameSlug: 'parolla', scores: data });
      onSuccess();
    } catch (err) {
      const msg = (err as AxiosError<ApiResponse>).response?.data?.error ?? 'Failed to submit';
      setError('root', { message: msg });
    } finally {
      setLoading(false);
    }
  };

  const fieldLabels: Record<'correct' | 'wrong' | 'blank', string> = {
    correct: t('parolla.correct'),
    wrong: t('parolla.wrong'),
    blank: t('parolla.blank'),
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack gap={5} align="stretch">
        {errors.root && (
          <Alert.Root status="error" borderRadius="lg">
            <Alert.Indicator />
            <Alert.Title>{errors.root.message}</Alert.Title>
          </Alert.Root>
        )}

        {(['correct', 'wrong', 'blank'] as const).map((field) => (
          <Field.Root key={field} invalid={!!errors[field]}>
            <Field.Label fontWeight="600">{fieldLabels[field]}</Field.Label>
            <Input type="number" min={0} {...register(field)} placeholder="0" />
            {errors[field] && <Field.ErrorText>{errors[field]?.message}</Field.ErrorText>}
          </Field.Root>
        ))}

        <Text fontSize="xs" color="text.muted">
          {t('parolla.scoringNote')}
        </Text>

        <Button type="submit" colorPalette="blue" loading={loading} loadingText={t('submitting')} fontWeight="600">
          {t('submitParolla')}
        </Button>
      </VStack>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EntryPage() {
  const t = useTranslations('entry');
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();
  const [parollaSubmitted, setParollaSubmitted] = useState<boolean | null>(null);

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (!user) return;
    const today = todayLocal();
    api.get<{ data: { gameSlug: string }[] }>(`/entries?from=${today}&to=${today}`)
      .then((res) => {
        const slugs = res.data.data.map((e) => e.gameSlug);
        setParollaSubmitted(slugs.includes('parolla'));
      })
      .catch(() => setParollaSubmitted(false));
  }, [user]);

  if (!user) return null;

  return (
    <AppShell>
      <Box maxW="520px" mx="auto">
        <Heading size="xl" fontWeight="800" mb={2}>{t('title')}</Heading>
        <Text color="text.muted" mb={8}>{t('subtitle')}</Text>

        {/* Wordle redirect card */}
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

        {/* Parolla form */}
        <Box bg="surface.card" borderRadius="2xl" borderWidth="1px" borderColor="border.subtle" p={6}>
          <Text fontWeight="700" fontSize="md" mb={5}>Parolla</Text>
          {parollaSubmitted === null ? (
            <HStack justify="center" py={8}><Spinner /></HStack>
          ) : parollaSubmitted ? (
            <Alert.Root status="success" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>{t('alreadySubmitted', { game: 'Parolla' })}</Alert.Title>
            </Alert.Root>
          ) : (
            <ParollaForm onSuccess={() => setParollaSubmitted(true)} />
          )}
        </Box>
      </Box>
    </AppShell>
  );
}
