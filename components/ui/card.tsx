import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export type CardProps = { children: ReactNode; title?: string; subtitle?: string; padding?: 'none' | 'sm' | 'md' | 'lg'; bordered?: boolean };
const paddingClasses = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export function Card({ children, title, subtitle, padding = 'md', bordered = true }: CardProps) {
  return (
    <View className={`rounded-[14px] bg-white dark:bg-theme-dark-surface ${paddingClasses[padding]} ${bordered ? 'border border-neutral-150 dark:border-theme-dark-border' : ''}`}>
      {title ? <Text className="mb-1 font-display text-lg font-bold text-neutral-900 dark:text-theme-dark-text-primary">{title}</Text> : null}
      {subtitle ? <Text className="mb-3 font-body text-[13px] text-neutral-500 dark:text-theme-dark-text-tertiary">{subtitle}</Text> : null}
      {children}
    </View>
  );
}
