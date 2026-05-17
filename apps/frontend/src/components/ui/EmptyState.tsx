import { Box, Text, VStack } from '@chakra-ui/react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
}

export function EmptyState({
  title = 'Nothing here yet',
  description = 'Data will appear here once available.',
}: EmptyStateProps) {
  return (
    <VStack
      gap={3}
      py={16}
      px={8}
      align="center"
      textAlign="center"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="border.subtle"
      borderRadius="xl"
    >
      <Text fontWeight="600" fontSize="lg">
        {title}
      </Text>
      <Text color="text.muted" fontSize="sm" maxW="sm">
        {description}
      </Text>
    </VStack>
  );
}
