'use client';

import { Box } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  p?: string | number | object;
  borderRadius?: string;
  cursor?: string;
  onClick?: () => void;
}

export function AnimatedCard({ children, p = 6, borderRadius = '2xl', cursor, onClick }: AnimatedCardProps) {
  return (
    <Box
      bg="surface.card"
      borderRadius={borderRadius}
      borderWidth="1px"
      borderColor="border.subtle"
      p={p}
      h="full"
      cursor={cursor}
      onClick={onClick}
      transition="box-shadow 0.2s ease, transform 0.2s ease"
      _hover={{ transform: { md: 'translateY(-2px)' }, boxShadow: { md: 'md' } }}
    />
  );
}
