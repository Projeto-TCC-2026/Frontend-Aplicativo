import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors } from '@/constants/design-tokens';
import type { PatientAlert } from '@/src/domain/alert';

export type AlertTone = 'critical' | 'attention';

export type AlertCardProps = { alert: PatientAlert };

/** Severidade crítica cai em vermelho; qualquer outra severidade usa atenção. */
export function resolveAlertTone(severity: string): AlertTone {
  const normalized = severity.toUpperCase();
  return normalized.includes('CRIT') || normalized.includes('HIGH') || normalized.includes('ALTA')
    ? 'critical'
    : 'attention';
}

/**
 * A cor da severidade (borda e ícone) é a mesma nos dois modos; apenas o fundo
 * do card troca para a variante escura.
 */
const toneClasses: Record<AlertTone, { container: string; icon: string; label: string }> = {
  critical: {
    container: 'border-semantic-critical bg-semantic-critical-bg dark:bg-theme-dark-critical-background',
    icon: colors.critical,
    label: 'Alerta crítico',
  },
  attention: {
    container: 'border-semantic-attention bg-semantic-attention-bg dark:bg-theme-dark-attention-background',
    icon: colors.attention,
    label: 'Alerta de atenção',
  },
};

export function AlertCard({ alert }: AlertCardProps) {
  const palette = toneClasses[resolveAlertTone(alert.severity)];
  const date = formatAlertDate(alert.createdAt);

  return (
    <View
      accessible
      accessibilityLabel={`${palette.label}. ${alert.title}. ${date}`}
      accessibilityRole="summary"
      className={`flex-row gap-3 rounded-[14px] border-[1.5px] p-6 ${palette.container}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-white dark:bg-theme-dark-surface">
        <Ionicons color={palette.icon} name="warning" size={24} />
      </View>

      <View className="flex-1 gap-1">
        {/* Texto do tipo de alerta: a informação não depende só da cor. */}
        <Text
          allowFontScaling
          className="font-body text-base font-semibold text-neutral-700 dark:text-theme-dark-text-secondary"
        >
          {palette.label}
        </Text>
        <Text
          allowFontScaling
          className="font-display text-lg font-bold leading-6 text-neutral-900 dark:text-theme-dark-text-primary"
        >
          {alert.title}
        </Text>
        <Text
          allowFontScaling
          className="font-data text-base text-neutral-700 dark:text-theme-dark-text-secondary"
        >
          {date}
        </Text>
      </View>
    </View>
  );
}

function formatAlertDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não informada';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
