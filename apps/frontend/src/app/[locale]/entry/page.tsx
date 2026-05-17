'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/lib/navigation';
import { useEffect } from 'react';
import { api } from '@/lib/api';
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
  Tabs,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@dail-game/types';

// ─── Wordle form ──────────────────────────────────────────────────────────────
const wordleSchema = z.object({
  attempt: z.coerce.number().int().min(1).max(7),
});
type WordleValues = z.infer<typeof wordleSchema>;

function WordleForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations('entry');
  const { register, handleSubmit, watch, formState: { errors }, setError } = useForm<WordleValues>({
    resolver: zodResolver(wordleSchema),
    defaultValues: { attempt: 3 },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const selected = Number(watch('attempt'));

  const onSubmit = async (data: WordleValues) => {
    setLoading(true);
    try {
      await api.post('/entries', { gameSlug: 'wordle', scores: data });
      setSuccess(true);
      onSuccess();
    } catch (err) {
      const msg = (err as AxiosError<ApiResponse>).response?.data?.error ?? 'Failed to submit';
      setError('root', { message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert.Root status="success" borderRadius="xl">
        <Alert.Indicator />
        <Alert.Title>{t('successWordle')}</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack gap={5} align="stretch">
        {errors.root && (
          <Alert.Root status="error" borderRadius="lg">
            <Alert.Indicator />
            <Alert.Title>{errors.root.message}</Alert.Title>
          </Alert.Root>
        )}

        <Field.Root invalid={!!errors.attempt}>
          <Field.Label fontWeight="600">{t('wordle.label')}</Field.Label>
          <HStack>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Box key={n} flex={1}>
                <input type="radio" id={`attempt-${n}`} value={n} {...register('attempt')} style={{ display: 'none' }} />
                <label htmlFor={`attempt-${n}`} style={{ display: 'block', width: '100%' }}>
                  <Button
                    as="div"
                    variant={selected === n ? 'solid' : 'outline'}
                    colorPalette={selected === n ? 'green' : 'gray'}
                    w="full"
                    size="sm"
                    cursor="pointer"
                    fontWeight={selected === n ? '700' : '400'}
                  >
                    {n}
                  </Button>
                </label>
              </Box>
            ))}
            <Box flex={1}>
              <input type="radio" id="attempt-7" value={7} {...register('attempt')} style={{ display: 'none' }} />
              <label htmlFor="attempt-7" style={{ display: 'block', width: '100%' }}>
                <Button
                  as="div"
                  variant={selected === 7 ? 'solid' : 'outline'}
                  colorPalette="red"
                  w="full"
                  size="sm"
                  cursor="pointer"
                  fontWeight={selected === 7 ? '700' : '400'}
                >
                  DNF
                </Button>
              </label>
            </Box>
          </HStack>
          {errors.attempt && <Field.ErrorText>{errors.attempt.message}</Field.ErrorText>}
        </Field.Root>

        <Button type="submit" colorPalette="green" loading={loading} loadingText={t('submitting')} fontWeight="600">
          {t('submitWordle')}
        </Button>
      </VStack>
    </form>
  );
}

// ─── Parolla form ─────────────────────────────────────────────────────────────
const parollaSchema = z.object({
  correct: z.coerce.number().int().min(0),
  wrong: z.coerce.number().int().min(0),
  blank: z.coerce.number().int().min(0),
}).refine((d) => d.correct + d.wrong + d.blank > 0, {
  message: 'At least one field must be non-zero',
});
type ParollaValues = z.infer<typeof parollaSchema>;

function ParollaForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations('entry');
  const { register, handleSubmit, formState: { errors }, setError } = useForm<ParollaValues>({
    resolver: zodResolver(parollaSchema),
    defaultValues: { correct: 0, wrong: 0, blank: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: ParollaValues) => {
    setLoading(true);
    try {
      await api.post('/entries', { gameSlug: 'parolla', scores: data });
      setSuccess(true);
      onSuccess();
    } catch (err) {
      const msg = (err as AxiosError<ApiResponse>).response?.data?.error ?? 'Failed to submit';
      setError('root', { message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert.Root status="success" borderRadius="xl">
        <Alert.Indicator />
        <Alert.Title>{t('successParolla')}</Alert.Title>
      </Alert.Root>
    );
  }

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
            <Input
              type="number"
              min={0}
              {...register(field)}
              placeholder="0"
            />
            {errors[field] && <Field.ErrorText>{errors[field]?.message}</Field.ErrorText>}
          </Field.Root>
        ))}

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

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  if (!user) return null;

  return (
    <AppShell>
      <Box maxW="520px" mx="auto">
        <Heading size="xl" fontWeight="800" mb={2}>
          {t('title')}
        </Heading>
        <Text color="text.muted" mb={8}>
          {t('subtitle')}
        </Text>

        <Box
          bg="surface.card"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="border.subtle"
          p={6}
        >
          <Tabs.Root defaultValue="wordle" variant="enclosed">
            <Tabs.List mb={6}>
              <Tabs.Trigger value="wordle">Wordle</Tabs.Trigger>
              <Tabs.Trigger value="parolla">Parolla</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="wordle">
              <WordleForm onSuccess={() => {}} />
            </Tabs.Content>
            <Tabs.Content value="parolla">
              <ParollaForm onSuccess={() => {}} />
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      </Box>
    </AppShell>
  );
}
