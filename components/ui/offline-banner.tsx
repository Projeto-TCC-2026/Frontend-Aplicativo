import { Text, View } from 'react-native';

export type OfflineBannerProps = { visible: boolean; message?: string };

export function OfflineBanner({ visible, message = 'Você está offline. Os dados serão sincronizados depois.' }: OfflineBannerProps) {
  if (!visible) return null;
  return <View accessibilityRole="alert" className="flex-row items-center gap-2 bg-semantic-attention-bg px-4 py-2"><Text className="font-data font-bold text-semantic-attention">!</Text><Text className="flex-1 font-body text-xs text-neutral-700">{message}</Text></View>;
}
