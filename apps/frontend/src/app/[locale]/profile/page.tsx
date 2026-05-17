'use client';

import { useEffect, useState } from 'react';
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

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'En az 3 karakter')
    .max(20, 'En fazla 20 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Sadece harf, rakam ve _ kullanılabilir'),
  displayName: z.string().min(1).max(50).trim(),
  avatarUrl: z.string().url().regex(/^https:\/\//).optional().or(z.literal('')),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
    newPassword: z.string().min(8, 'En az 8 karakter'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const t = useTranslations('profile');
  const { user, isInitialized, updateUser } = useAuthStore();
  const router = useRouter();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username ?? '',
      displayName: user?.displayName ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  if (!user) return null;

  const onProfileSubmit = async (data: ProfileValues) => {
    setProfileSuccess(false);
    try {
      const res = await api.patch<{ data: typeof user }>('/users/me', {
        username: data.username,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl || null,
      });
      updateUser(res.data.data);
      setProfileSuccess(true);
    } catch (err) {
      const msg = (err as AxiosError<ApiResponse>).response?.data?.error ?? 'Failed to update';
      profileForm.setError('root', { message: msg });
    }
  };

  const onPasswordSubmit = async (data: PasswordValues) => {
    setPasswordSuccess(false);
    try {
      await api.patch('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
      setPasswordSuccess(true);
    } catch (err) {
      const msg = (err as AxiosError<ApiResponse>).response?.data?.error ?? 'Failed to change password';
      passwordForm.setError('root', { message: msg });
    }
  };

  return (
    <AppShell>
      <Box maxW="480px" mx="auto">
        <Heading size="xl" fontWeight="800" mb={8}>{t('title')}</Heading>

        {/* Avatar card */}
        <HStack gap={4} mb={6} p={5} bg="surface.card" borderRadius="2xl" borderWidth="1px" borderColor="border.subtle">
          <Avatar.Root size="xl">
            <Avatar.Fallback name={user.displayName} />
            {user.avatarUrl && <Avatar.Image src={user.avatarUrl} alt={user.displayName} />}
          </Avatar.Root>
          <VStack align="flex-start" gap={1}>
            <Text fontWeight="700" fontSize="lg">{user.displayName}</Text>
            <Text color="text.muted" fontSize="sm">@{user.username}</Text>
            <Text color="text.muted" fontSize="sm">{user.email}</Text>
            <Badge colorPalette={user.role === 'admin' ? 'red' : 'brand'} size="sm" variant="subtle">
              {user.role}
            </Badge>
          </VStack>
        </HStack>

        {/* Profile form */}
        <Box bg="surface.card" borderRadius="2xl" borderWidth="1px" borderColor="border.subtle" p={6} mb={6}>
          <Text fontWeight="700" fontSize="md" mb={5}>{t('profileSection')}</Text>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            <VStack gap={5} align="stretch">
              {profileForm.formState.errors.root && (
                <Alert.Root status="error" borderRadius="lg">
                  <Alert.Indicator />
                  <Alert.Title>{profileForm.formState.errors.root.message}</Alert.Title>
                </Alert.Root>
              )}
              {profileSuccess && (
                <Alert.Root status="success" borderRadius="lg">
                  <Alert.Indicator />
                  <Alert.Title>{t('saveSuccess')}</Alert.Title>
                </Alert.Root>
              )}

              <Field.Root invalid={!!profileForm.formState.errors.username}>
                <Field.Label fontWeight="600">{t('username')}</Field.Label>
                <Input placeholder="kullanici_adi" {...profileForm.register('username')} />
                <Field.HelperText>3–20 karakter, harf/rakam/_</Field.HelperText>
                {profileForm.formState.errors.username && (
                  <Field.ErrorText>{profileForm.formState.errors.username.message}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!profileForm.formState.errors.displayName}>
                <Field.Label fontWeight="600">{t('displayName')}</Field.Label>
                <Input placeholder={t('displayName')} {...profileForm.register('displayName')} />
                {profileForm.formState.errors.displayName && (
                  <Field.ErrorText>{profileForm.formState.errors.displayName.message}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!profileForm.formState.errors.avatarUrl}>
                <Field.Label fontWeight="600">{t('avatarUrl')}</Field.Label>
                <Input placeholder="https://..." {...profileForm.register('avatarUrl')} />
                <Field.HelperText>{t('avatarHelper')}</Field.HelperText>
                {profileForm.formState.errors.avatarUrl && (
                  <Field.ErrorText>{profileForm.formState.errors.avatarUrl.message}</Field.ErrorText>
                )}
              </Field.Root>

              <Button
                type="submit"
                colorPalette="brand"
                loading={profileForm.formState.isSubmitting}
                disabled={!profileForm.formState.isDirty}
                fontWeight="600"
              >
                {t('saveButton')}
              </Button>
            </VStack>
          </form>
        </Box>

        {/* Password form */}
        <Box bg="surface.card" borderRadius="2xl" borderWidth="1px" borderColor="border.subtle" p={6}>
          <Text fontWeight="700" fontSize="md" mb={5}>{t('passwordSection')}</Text>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
            <VStack gap={5} align="stretch">
              {passwordForm.formState.errors.root && (
                <Alert.Root status="error" borderRadius="lg">
                  <Alert.Indicator />
                  <Alert.Title>{passwordForm.formState.errors.root.message}</Alert.Title>
                </Alert.Root>
              )}
              {passwordSuccess && (
                <Alert.Root status="success" borderRadius="lg">
                  <Alert.Indicator />
                  <Alert.Title>{t('passwordSuccess')}</Alert.Title>
                </Alert.Root>
              )}

              <Field.Root invalid={!!passwordForm.formState.errors.currentPassword}>
                <Field.Label fontWeight="600">{t('currentPassword')}</Field.Label>
                <Input type="password" {...passwordForm.register('currentPassword')} />
                {passwordForm.formState.errors.currentPassword && (
                  <Field.ErrorText>{passwordForm.formState.errors.currentPassword.message}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!passwordForm.formState.errors.newPassword}>
                <Field.Label fontWeight="600">{t('newPassword')}</Field.Label>
                <Input type="password" placeholder="En az 8 karakter" {...passwordForm.register('newPassword')} />
                {passwordForm.formState.errors.newPassword && (
                  <Field.ErrorText>{passwordForm.formState.errors.newPassword.message}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!passwordForm.formState.errors.confirmPassword}>
                <Field.Label fontWeight="600">{t('confirmPassword')}</Field.Label>
                <Input type="password" {...passwordForm.register('confirmPassword')} />
                {passwordForm.formState.errors.confirmPassword && (
                  <Field.ErrorText>{passwordForm.formState.errors.confirmPassword.message}</Field.ErrorText>
                )}
              </Field.Root>

              <Button
                type="submit"
                colorPalette="red"
                variant="outline"
                loading={passwordForm.formState.isSubmitting}
                fontWeight="600"
              >
                {t('changePassword')}
              </Button>
            </VStack>
          </form>
        </Box>
      </Box>
    </AppShell>
  );
}
