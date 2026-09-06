import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Button } from './button';

export type ErrorStateProps = { title?: string; description?: string; actionLabel?: string; onRetry?: () => void; action?: ReactNode };

export function ErrorState({ title = 'Não foi possível carregar', description = 'Tente novamente em alguns instantes.', actionLabel = 'Tentar novamente', onRetry, action }: ErrorStateProps) {
  return <View className="items-center justify-center p-6"><Text className="mb-2 font-data text-[28px] font-bold text-semantic-critical">!</Text><Text className="text-center font-display text-lg font-bold text-neutral-900">{title}</Text><Text className="mb-4 mt-2 max-w-[320px] text-center font-body text-sm leading-5 text-neutral-700">{description}</Text>{action ?? (onRetry ? <Button size="sm" onPress={onRetry}>{actionLabel}</Button> : null)}</View>;
}
