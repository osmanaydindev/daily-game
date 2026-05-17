'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { Reveal } from '@/components/ui/Reveal';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react';

export default function GamesPage() {
  const t = useTranslations('games');

  const GAMES = [
    {
      slug: 'wordle',
      name: 'Wordle',
      description: t('wordle.description'),
      url: 'https://www.nytimes.com/games/wordle/index.html',
      color: 'green',
      scoring: t('wordle.scoring'),
    },
    {
      slug: 'parolla',
      name: 'Parolla',
      description: t('parolla.description'),
      url: 'https://parolla.app',
      color: 'blue',
      scoring: t('parolla.scoring'),
    },
  ];

  return (
    <AppShell>
      <Reveal>
        <Heading size="xl" fontWeight="800" mb={2}>{t('title')}</Heading>
        <Text color="text.muted" mb={8}>{t('subtitle')}</Text>
      </Reveal>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
        {GAMES.map((game, i) => (
          <GridItem key={game.slug}>
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
              viewport={{ once: true, margin: '-40px' }}
              style={{ height: '100%' }}
            >
              <Box
                bg="surface.card"
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="border.subtle"
                p={6}
                h="full"
                display="flex"
                flexDirection="column"
                gap={4}
                boxShadow="sm"
                transition="box-shadow 0.25s"
                _hover={{ boxShadow: 'xl' }}
              >
                <HStack gap={3}>
                  <VStack align="flex-start" gap={0}>
                    <Text fontWeight="800" fontSize="xl">{game.name}</Text>
                    <Badge colorPalette={game.color} size="sm" variant="subtle">{t('daily')}</Badge>
                  </VStack>
                </HStack>

                <Text color="text.muted" fontSize="sm" flex={1}>{game.description}</Text>

                <Box
                  bg="surface.subtle"
                  borderRadius="lg"
                  px={4}
                  py={3}
                  borderWidth="1px"
                  borderColor="border.subtle"
                >
                  <Text fontSize="xs" color="text.muted" fontWeight="500" mb={1}>{t('scoring')}</Text>
                  <Text fontSize="sm">{game.scoring}</Text>
                </Box>

                <a href={game.url} target="_blank" rel="noopener noreferrer" style={{ width: '100%' }}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button colorPalette={game.color} variant="outline" w="full" fontWeight="600">
                      {t('playNow')}
                    </Button>
                  </motion.div>
                </a>
              </Box>
            </motion.div>
          </GridItem>
        ))}
      </Grid>
    </AppShell>
  );
}
