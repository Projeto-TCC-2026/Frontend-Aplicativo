import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '@/constants/design-tokens';

export type LoadingStateProps = { size?: 'sm' | 'md' | 'lg'; text?: string; fullPage?: boolean };
const sizes = { sm: 'small', md: 'large', lg: 48 } as const;

export function LoadingState({ size = 'md', text, fullPage = false }: LoadingStateProps) {
  return <View className={`items-center justify-center gap-2.5 p-4 ${fullPage ? 'min-h-[240px] flex-1' : ''}`}><ActivityIndicator color={colors.primary} size={sizes[size]} />{text ? <Text className="font-body text-sm text-neutral-700 dark:text-theme-dark-text-secondary">{text}</Text> : null}</View>;
}
