import { colors } from '@/constants/design-tokens';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, useColorScheme, View } from 'react-native';

export type EmptyStateProps = { title?: string; description?: string; action?: ReactNode };

export function EmptyState({ title = 'Nenhum item encontrado', description, action }: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? colors.darkTextTertiary : colors.neutral500;

  return <View className="items-center justify-center p-6">
    <View className="mb-3 h-12 items-center justify-center">
      <Ionicons accessible={false} color={iconColor} name="file-tray-outline" size={48} />
    </View>
    <Text className="text-center font-display text-lg font-bold text-neutral-900 dark:text-theme-dark-text-primary">{title}</Text>
    
    {description
      ? <Text className="mt-2 max-w-[320px] text-center font-body text-sm leading-5 text-neutral-500 dark:text-theme-dark-text-tertiary">{description}</Text>
      : null
    }

    {action
      ? <View className="mt-4">{action}</View>
      : null
    }
  </View>;
}
