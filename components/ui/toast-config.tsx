import { Text, View } from 'react-native';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

const toneClasses = {
  success: 'border-semantic-success',
  error: 'border-semantic-critical',
  info: 'border-semantic-info',
} as const;

function renderToast({ type, text1, text2 }: ToastConfigParams<unknown>) {
  const borderClass = toneClasses[type as keyof typeof toneClasses] ?? toneClasses.info;
  return (
    <View className={`mx-4 gap-1 rounded-[12px] border-l-4 bg-white p-4 shadow-lg ${borderClass}`}>
      {text1 ? <Text className="font-display text-[15px] font-bold text-neutral-900">{text1}</Text> : null}
      {text2 ? <Text className="font-body text-[13px] text-neutral-700">{text2}</Text> : null}
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: renderToast,
  error: renderToast,
  info: renderToast,
};
