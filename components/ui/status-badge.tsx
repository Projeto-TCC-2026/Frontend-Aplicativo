import { Text, View } from 'react-native';

export type StatusBadgeTone = 'success' | 'attention' | 'critical' | 'info' | 'disabled';
export type StatusBadgeProps = { label: string; tone: StatusBadgeTone };
const toneClasses: Record<StatusBadgeTone, { container: string; dot: string; text: string }> = {
  success: { container: 'bg-semantic-success-bg', dot: 'bg-semantic-success', text: 'text-semantic-success' },
  attention: { container: 'bg-semantic-attention-bg', dot: 'bg-semantic-attention', text: 'text-semantic-attention' },
  critical: { container: 'bg-semantic-critical-bg', dot: 'bg-semantic-critical', text: 'text-semantic-critical' },
  info: { container: 'bg-semantic-info-bg', dot: 'bg-semantic-info', text: 'text-semantic-info' },
  disabled: { container: 'bg-semantic-disabled-bg', dot: 'bg-neutral-500', text: 'text-neutral-500' },
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const palette = toneClasses[tone];
  return <View accessibilityLabel={`Status: ${label}`} className={`min-h-7 flex-row items-center gap-1.5 rounded-[9px] px-2.5 ${palette.container}`}><View className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} /><Text className={`font-data text-[10px] font-semibold uppercase ${palette.text}`}>{label}</Text></View>;
}
