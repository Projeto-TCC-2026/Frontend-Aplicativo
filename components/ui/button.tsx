import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { colors } from '@/constants/design-tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonProps = { children: ReactNode; variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; loadingText?: string; disabled?: boolean; fullWidth?: boolean; onPress?: () => void; accessibilityLabel?: string };

const variantClasses: Record<ButtonVariant, { container: string; text: string; indicator: string }> = {
  primary: { container: 'bg-brand-dark', text: 'text-white', indicator: colors.white },
  secondary: { container: 'border-[1.5px] border-brand-dark bg-white dark:bg-theme-dark-surface', text: 'text-brand-dark dark:text-theme-dark-action', indicator: colors.primary },
  ghost: { container: 'bg-transparent', text: 'text-brand-dark dark:text-theme-dark-action', indicator: colors.primary },
  destructive: { container: 'bg-semantic-critical', text: 'text-white', indicator: colors.white },
  success: { container: 'bg-semantic-success', text: 'text-white', indicator: colors.white },
};
const sizeClasses: Record<ButtonSize, string> = { sm: 'min-h-11 px-3', md: 'min-h-12 px-4', lg: 'min-h-[52px] px-5' };

export function Button({ children, variant = 'primary', size = 'md', loading = false, loadingText = 'Processando...', disabled = false, fullWidth = false, onPress, accessibilityLabel }: ButtonProps) {
  const unavailable = disabled || loading;
  const palette = variantClasses[variant];
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" accessibilityState={{ disabled: unavailable, busy: loading }} className={`min-h-11 flex-row items-center justify-center gap-2 rounded-[9px] ${sizeClasses[size]} ${palette.container} ${fullWidth ? 'self-stretch' : ''} ${unavailable ? 'opacity-70' : ''}`} disabled={unavailable} onPress={onPress}>
      {loading ? <ActivityIndicator color={palette.indicator} size="small" /> : null}
      <Text className={`font-body text-[15px] font-bold ${palette.text}`}>{loading ? loadingText : children}</Text>
    </Pressable>
  );
}
