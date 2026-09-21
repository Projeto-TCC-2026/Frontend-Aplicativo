import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

type ToastTone = 'success' | 'error' | 'warning' | 'info';

const toastStyles: Record<ToastTone, { border: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }> = {
  success: { border: 'border-semantic-success', icon: 'checkmark-circle', iconColor: '#15803D' },
  error: { border: 'border-semantic-critical', icon: 'alert-circle', iconColor: '#DC2626' },
  warning: { border: 'border-semantic-warning', icon: 'warning', iconColor: '#B45309' },
  info: { border: 'border-semantic-info', icon: 'information-circle', iconColor: '#0369A1' },
} as const;

function renderToast({ type, text1, text2 }: ToastConfigParams<unknown>) {
  const style = toastStyles[type as ToastTone] ?? toastStyles.info;
  return (
    <View accessibilityRole="alert" className={`mx-4 min-h-[68px] flex-row items-center gap-3 rounded-[14px] border-l-4 bg-white px-4 py-3 shadow-lg dark:bg-theme-dark-surface ${style.border}`}>
      <Ionicons color={style.iconColor} name={style.icon} size={24} />
      <View className="flex-1 gap-0.5">
        {text1 ? <Text className="font-display text-[15px] font-bold text-neutral-900 dark:text-theme-dark-text-primary">{text1}</Text> : null}
        {text2 ? <Text className="font-body text-[13px] leading-[18px] text-neutral-700 dark:text-theme-dark-text-secondary">{text2}</Text> : null}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: renderToast,
  error: renderToast,
  warning: renderToast,
  info: renderToast,
};
