'use client';

import { motion } from 'framer-motion';
import { Box } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  p?: string | number | object;
  borderRadius?: string;
  cursor?: string;
  onClick?: () => void;
  href?: string;
}

export function AnimatedCard({ children, delay = 0, p = 6, borderRadius = '2xl', cursor, onClick }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, margin: '-40px' }}
      style={{ cursor: cursor || 'default' }}
      onClick={onClick}
    >
      <Box
        bg="surface.card"
        borderRadius={borderRadius}
        borderWidth="1px"
        borderColor="border.subtle"
        p={p}
        h="full"
      >
        {children}
      </Box>
    </motion.div>
  );
}
