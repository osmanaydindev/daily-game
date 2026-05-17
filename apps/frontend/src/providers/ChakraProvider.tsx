'use client';

import { ChakraProvider, createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import { ThemeProvider, useTheme } from 'next-themes';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#f0f4ff' },
          100: { value: '#e0eaff' },
          200: { value: '#c0d4ff' },
          300: { value: '#92b4ff' },
          400: { value: '#628aff' },
          500: { value: '#3a5fff' },
          600: { value: '#1f3ef5' },
          700: { value: '#1730c8' },
          800: { value: '#1929a0' },
          900: { value: '#1c277d' },
          950: { value: '#141a51' },
        },
      },
      fonts: {
        heading: { value: "'Inter', 'system-ui', sans-serif" },
        body: { value: "'Inter', 'system-ui', sans-serif" },
        mono: { value: "'JetBrains Mono', 'Menlo', monospace" },
      },
    },
    semanticTokens: {
      colors: {
        surface: {
          value: { base: '{colors.white}', _dark: '#111827' },
        },
        'surface.subtle': {
          value: { base: '#f8fafc', _dark: '#1a2235' },
        },
        'surface.card': {
          value: { base: '{colors.white}', _dark: '#1e2a3a' },
        },
        'border.subtle': {
          value: { base: '#e2e8f0', _dark: '#2d3f55' },
        },
        'text.muted': {
          value: { base: '#64748b', _dark: '#94a3b8' },
        },
      },
    },
  },
});

const system = createSystem(defaultConfig, config);

export function AppChakraProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </ChakraProvider>
  );
}

// Hook that components use instead of useColorMode
export function useColorMode() {
  const { theme, setTheme } = useTheme();
  return {
    colorMode: theme as 'light' | 'dark',
    toggleColorMode: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    setColorMode: setTheme,
  };
}
