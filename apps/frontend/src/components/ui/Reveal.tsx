'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
  duration?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, direction = 'up', duration = 0.35, className }: RevealProps) {
  const initial = {
    opacity: 0,
    y: direction === 'up' ? 16 : 0,
    x: direction === 'left' ? -16 : direction === 'right' ? 16 : 0,
  };

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-40px' }}
    >
      {children}
    </motion.div>
  );
}

export const StaggerList = motion.div;

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};
