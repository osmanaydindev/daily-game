import { Alert, Button, VStack } from '@chakra-ui/react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <VStack gap={4} py={8} align="stretch">
      <Alert.Root status="error" borderRadius="lg">
        <Alert.Indicator />
        <Alert.Title>{message}</Alert.Title>
      </Alert.Root>
      {onRetry && (
        <Button onClick={onRetry} colorPalette="brand" variant="outline" size="sm" alignSelf="center">
          Try again
        </Button>
      )}
    </VStack>
  );
}
