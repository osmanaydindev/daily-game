'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const refresh = useAuthStore((s) => s.refresh);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isInitialized) return null; // or a global spinner

  return <>{children}</>;
}
