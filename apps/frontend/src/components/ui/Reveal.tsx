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

export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  duration = 0.5,
  className,
}: RevealProps) {
  const initial = {
    opacity: 0,
    y: direction === 'up' ? 28 : 0,
    x: direction === 'left' ? -28 : direction === 'right' ? 28 : 0,
  };

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </motion.div>
  );
}

/* Stagger container: wrap list items with StaggerList, each child in StaggerItem */
export const StaggerList = motion.div;

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};
