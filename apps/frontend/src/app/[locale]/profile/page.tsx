'use client';

import { useEffect, useRef, useState } from 'react';
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
  IconButton,
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

const MAX_SIZE = 5 * 1024 * 1024;

export default function ProfilePage() {
  const t = useTranslations('profile');
  const { user, isInitialized, updateUser } = useAuthStore();
  const router = useRouter();

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username ?? '',
      displayName: user?.displayName ?? '',
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  if (!user) return null;

  const currentAvatar = avatarPreview ?? user.avatarUrl ?? undefined;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    setAvatarSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Sadece resim dosyası yükleyebilirsiniz.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setAvatarError('Dosya boyutu maksimum 5 MB olabilir.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarUploading(true);
    setAvatarError(null);
    setAvatarSuccess(false);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await api.post<{ data: typeof user }>('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.data);
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarSuccess(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const msg = (err as AxiosError<ApiResponse>).response?.data?.error ?? 'Yükleme başarısız';
      setAvatarError(msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const onProfileSubmit = async (data: ProfileValues) => {
    setProfileSuccess(false);
    try {
      const res = await api.patch<{ data: typeof user }>('/users/me', {
        username: data.username,
        displayName: data.displayName,
      });
      updateUser(res.data.data);
      profileForm.reset({
        username: res.data.data.username,
        displayName: res.data.data.displayName,
      });
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
        <Box bg="surface.card" borderRadius="2xl" borderWidth="1px" borderColor="border.subtle" p={5} mb={6}>
          <Text fontWeight="700" fontSize="md" mb={4}>Profil Resmi</Text>

          <HStack gap={5} align="flex-start">
            <Box position="relative" flexShrink={0}>
              <Avatar.Root size="2xl">
                <Avatar.Fallback name={user.displayName} />
                {currentAvatar && <Avatar.Image src={currentAvatar} alt={user.displayName} />}
              </Avatar.Root>
              <IconButton
                aria-label="Fotoğraf seç"
                size="xs"
                borderRadius="full"
                position="absolute"
                bottom={0}
                right={0}
                colorPalette="brand"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </IconButton>
            </Box>

            <VStack align="flex-start" gap={2} flex={1}>
              <Text fontWeight="700" fontSize="lg">{user.displayName}</Text>
              <Text color="text.muted" fontSize="sm">@{user.username}</Text>
              <Text color="text.muted" fontSize="xs">{user.email}</Text>
              <Badge colorPalette={user.role === 'admin' ? 'red' : 'brand'} size="sm" variant="subtle">
                {user.role}
              </Badge>
            </VStack>
          </HStack>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />

          {avatarError && (
            <Alert.Root status="error" borderRadius="lg" mt={4}>
              <Alert.Indicator />
              <Alert.Title>{avatarError}</Alert.Title>
            </Alert.Root>
          )}
          {avatarSuccess && (
            <Alert.Root status="success" borderRadius="lg" mt={4}>
              <Alert.Indicator />
              <Alert.Title>Profil resmi güncellendi.</Alert.Title>
            </Alert.Root>
          )}

          {avatarFile && (
            <HStack mt={4} gap={3}>
              <Text fontSize="xs" color="text.muted" flex={1} truncate>{avatarFile.name}</Text>
              <Button
                size="sm"
                colorPalette="brand"
                loading={avatarUploading}
                onClick={onAvatarUpload}
                fontWeight="600"
              >
                Yükle
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(null);
                  setAvatarError(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                İptal
              </Button>
            </HStack>
          )}

          {!avatarFile && (
            <Button
              size="sm"
              variant="outline"
              mt={4}
              onClick={() => fileInputRef.current?.click()}
            >
              Fotoğraf Değiştir
            </Button>
          )}
        </Box>

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
