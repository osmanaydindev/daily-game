'use client';

import { Box } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from '@/lib/navigation';
import { Navbar } from './Navbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Box minH="100vh" bg="surface">
      <Navbar />
      <AnimatePresence mode="popLayout">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </Box>
  );
}
