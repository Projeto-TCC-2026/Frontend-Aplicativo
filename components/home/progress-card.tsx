import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { colors } from '@/constants/design-tokens';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export type ProgressCardProps = {
  procedureTitle: string;
  doctorName: string;
  startDate: string;
  /** Nulo quando o acompanhamento não tem data de término prevista. */
  endDate: string | null;
};

export type ProcedureProgress = {
  currentDay: number;
  /** `null` quando não há `endDate`: não existe total contra o qual medir. */
  totalDays: number | null;
  /** `null` quando não há total, para não renderizar barra de progresso. */
  ratio: number | null;
};

/**
 * Calcula o dia atual do acompanhamento e, quando há `endDate`, o total de dias
 * da janela `startDate`→`endDate`. O dia de início conta como dia 1.
 *
 * Sem `endDate` válido, `totalDays` e `ratio` voltam `null`: o acompanhamento
 * não tem fim previsto, então só o dia corrente é conhecido.
 */
export function calculateProcedureProgress(
  startDate: string,
  endDate: string | null,
  today: Date = new Date(),
): ProcedureProgress {
  const start = startOfDay(startDate);
  const end = endDate === null ? null : startOfDay(endDate);
  const current = startOfDay(today) ?? startOfDay(new Date()) ?? 0;

  if (start === null) return { currentDay: 0, totalDays: null, ratio: null };

  const elapsed = Math.round((current - start) / MILLISECONDS_PER_DAY) + 1;

  if (end === null) {
    return { currentDay: Math.max(1, elapsed), totalDays: null, ratio: null };
  }

  const totalDays = Math.max(1, Math.round((end - start) / MILLISECONDS_PER_DAY) + 1);
  const currentDay = clamp(elapsed, 1, totalDays);

  return { currentDay, totalDays, ratio: clamp(currentDay / totalDays, 0, 1) };
}

export function ProgressCard({ procedureTitle, doctorName, startDate, endDate }: ProgressCardProps) {
  const { currentDay, totalDays, ratio } = calculateProcedureProgress(startDate, endDate);
  const hasTotal = totalDays !== null && ratio !== null;

  return (
    <View className="relative overflow-hidden rounded-lg border border-neutral-150 bg-white p-4 shadow-sm dark:border-theme-dark-border dark:bg-theme-dark-surface">
      <Ionicons
        accessible={false}
        color={colors.neutral500}
        name="calendar-outline"
        size={64}
        style={{ position: 'absolute', right: 8, top: 8, opacity: 0.1 }}
      />
      <View className="relative z-10 gap-3">
        <View className="gap-1.5 pr-12">
          <Text
            allowFontScaling
            className="font-body text-xs font-medium tracking-wide text-neutral-500 dark:text-theme-dark-text-tertiary"
          >
            Procedimento
          </Text>
          <Text
            allowFontScaling
            className="font-display text-lg font-bold leading-6 text-neutral-900 dark:text-theme-dark-text-primary"
          >
            {procedureTitle}
          </Text>
          <Text
            allowFontScaling
            className="font-body text-sm font-medium text-neutral-700 dark:text-theme-dark-text-secondary"
          >
            Dr. {doctorName}
          </Text>
        </View>

        <View className="h-px bg-neutral-300/70 dark:bg-theme-dark-border" />

        <View className="gap-2">
          <View className="flex-row items-center justify-between gap-3">
            <Text
              allowFontScaling
              className="font-body text-sm font-medium tracking-wide text-neutral-500 dark:text-theme-dark-text-tertiary"
            >
              Dias de acompanhamento
            </Text>
            <Text
              allowFontScaling
              className="font-data text-3xl font-semibold text-brand-dark dark:text-theme-dark-action"
            >
              {currentDay}
              {hasTotal ? (
                <Text className="font-data text-lg font-medium text-neutral-500 dark:text-theme-dark-text-tertiary">
                  {' / '}{totalDays}
                </Text>
              ) : null}
            </Text>
          </View>
          {hasTotal ? (
            <View
              accessibilityLabel="Progresso do acompanhamento"
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: totalDays,
                now: currentDay,
                text: `Dia ${currentDay} de ${totalDays} do acompanhamento`,
              }}
              className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-150 dark:bg-theme-dark-border"
            >
              <View
                className="h-full rounded-full bg-brand-dark dark:bg-theme-dark-action"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </View>
          ) : (
            <Text
              allowFontScaling
              className="font-body text-xs text-center text-neutral-700 dark:text-theme-dark-text-secondary"
            >
              Acompanhamento em andamento
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function startOfDay(value: string | Date): number | null {
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else {
    const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    date = isoDate
      ? new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]))
      : new Date(value);
  }
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
