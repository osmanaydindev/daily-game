'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/lib/navigation';
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
  HStack,
  Avatar,
  Alert,
  Badge,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@dail-game/types';
import { useState } from 'react';

const schema = z.object({
  displayName: z.string().min(1).max(50).trim(),
  avatarUrl: z.string().url().regex(/^https:\/\//).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const t = useTranslations('profile');
  const { user, isInitialized, updateUser } = useAuthStore();
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  const { register, handleSubmit, formState: { errors, isDirty }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  });

  if (!user) return null;

  const onSubmit = async (data: FormValues) => {
    setSuccess(false);
    try {
      const res = await api.patch<{ data: typeof user }>('/users/me', {
        displayName: data.displayName,
        avatarUrl: data.avatarUrl || null,
      });
      updateUser(res.data.data);
      setSuccess(true);
    } catch (err) {
      const msg = (err as AxiosError<ApiResponse>).response?.data?.error ?? 'Failed to update';
      setError('root', { message: msg });
    }
  };

  return (
    <AppShell>
      <Box maxW="480px" mx="auto">
        <Heading size="xl" fontWeight="800" mb={8}>
          {t('title')}
        </Heading>

        <HStack gap={4} mb={8} p={5} bg="surface.card" borderRadius="2xl" borderWidth="1px" borderColor="border.subtle">
          <Avatar.Root size="xl">
            <Avatar.Fallback name={user.displayName} />
            {user.avatarUrl && <Avatar.Image src={user.avatarUrl} alt={user.displayName} />}
          </Avatar.Root>
          <VStack align="flex-start" gap={1}>
            <Text fontWeight="700" fontSize="lg">{user.displayName}</Text>
            <Text color="text.muted" fontSize="sm">{user.email}</Text>
            <Badge colorPalette={user.role === 'admin' ? 'red' : 'brand'} size="sm" variant="subtle">
              {user.role}
            </Badge>
          </VStack>
        </HStack>

        <Box bg="surface.card" borderRadius="2xl" borderWidth="1px" borderColor="border.subtle" p={6}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack gap={5} align="stretch">
              {errors.root && (
                <Alert.Root status="error" borderRadius="lg">
                  <Alert.Indicator />
                  <Alert.Title>{errors.root.message}</Alert.Title>
                </Alert.Root>
              )}
              {success && (
                <Alert.Root status="success" borderRadius="lg">
                  <Alert.Indicator />
                  <Alert.Title>{t('saveSuccess')}</Alert.Title>
                </Alert.Root>
              )}

              <Field.Root invalid={!!errors.displayName}>
                <Field.Label fontWeight="600">{t('displayName')}</Field.Label>
                <Input placeholder={t('displayName')} {...register('displayName')} />
                {errors.displayName && <Field.ErrorText>{errors.displayName.message}</Field.ErrorText>}
              </Field.Root>

              <Field.Root invalid={!!errors.avatarUrl}>
                <Field.Label fontWeight="600">{t('avatarUrl')}</Field.Label>
                <Input placeholder="https://..." {...register('avatarUrl')} />
                <Field.HelperText>{t('avatarHelper')}</Field.HelperText>
                {errors.avatarUrl && <Field.ErrorText>{errors.avatarUrl.message}</Field.ErrorText>}
              </Field.Root>

              <Button
                type="submit"
                colorPalette="brand"
                loading={false}
                disabled={!isDirty}
                fontWeight="600"
              >
                {t('saveButton')}
              </Button>
            </VStack>
          </form>
        </Box>
      </Box>
    </AppShell>
  );
}
