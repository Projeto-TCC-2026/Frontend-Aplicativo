import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export type EmptyStateProps = { title?: string; description?: string; action?: ReactNode };

export function EmptyState({ title = 'Nenhum item encontrado', description, action }: EmptyStateProps) {
  return <View className="items-center justify-center p-6"><View className="mb-3 h-12 w-12 rounded-full bg-brand-light" /><Text className="text-center font-display text-lg font-bold text-neutral-900">{title}</Text>{description ? <Text className="mt-2 max-w-[320px] text-center font-body text-sm leading-5 text-neutral-500">{description}</Text> : null}{action ? <View className="mt-4">{action}</View> : null}</View>;
}
