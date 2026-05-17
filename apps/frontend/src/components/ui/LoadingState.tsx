import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <Flex justify="center" align="center" py={16}>
      <VStack gap={3}>
        <Spinner size="lg" colorPalette="brand" />
        <Text color="text.muted" fontSize="sm">
          {label}
        </Text>
      </VStack>
    </Flex>
  );
}
