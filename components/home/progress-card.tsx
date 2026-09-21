import { Text, View } from 'react-native';

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
    <View className="gap-3 rounded-[14px] border border-neutral-150 bg-white p-6 dark:border-theme-dark-border dark:bg-theme-dark-surface">
      {/* Frase em fonte de display; a mono fica só nos números. */}
      <Text
        allowFontScaling
        className="font-display text-lg font-bold text-neutral-900 dark:text-theme-dark-text-primary"
      >
        Dia <Text className="font-data font-semibold">{currentDay}</Text>
        {hasTotal ? (
          <>
            {' de '}
            <Text className="font-data font-semibold">{totalDays}</Text>
          </>
        ) : (
          ' de acompanhamento'
        )}
      </Text>

      {/* Sem data de término prevista não há barra: não existe total a medir. */}
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
          className="h-3 w-full overflow-hidden rounded-[9px] bg-neutral-150 dark:bg-theme-dark-border"
        >
          {/* Largura proporcional: NativeWind não gera classe para porcentagem dinâmica. */}
          <View
            className="h-full rounded-[9px] bg-brand-dark dark:bg-theme-dark-action"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </View>
      ) : (
        <Text
          allowFontScaling
          className="font-body text-base text-neutral-700 dark:text-theme-dark-text-secondary"
        >
          Acompanhamento sem data de término prevista.
        </Text>
      )}

      <Text
        allowFontScaling
        className="font-display text-xl font-bold leading-[26px] text-neutral-900 dark:text-theme-dark-text-primary"
      >
        {procedureTitle}
      </Text>
      <Text
        allowFontScaling
        className="-mt-2 font-body text-base font-medium text-neutral-700 dark:text-theme-dark-text-secondary"
      >
        Dr. {doctorName}
      </Text>
    </View>
  );
}

function startOfDay(value: string | Date): number | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
