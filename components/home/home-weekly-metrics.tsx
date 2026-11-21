import { colors } from '@/constants/design-tokens';
import { formatDecimal } from '@/core/helpers';
import type { PatientFieldTrend, PatientHomeMetrics } from '@/src/domain/patient-home-metrics';
import { Text, View } from 'react-native';
import { Circle, Line, Path, Svg } from 'react-native-svg';

const CHART_WIDTH = 300;
const CHART_HEIGHT = 132;
const PLOT_LEFT = 22;
const PLOT_RIGHT = 292;
const PLOT_TOP = 12;
const PLOT_BOTTOM = 106;

export function HomeWeeklyMetrics({ metrics }: { metrics: PatientHomeMetrics }) {
  const submittedDays = metrics.dailyCheckins.filter((item) => item.submitted).length;

  return (
    <View className="gap-4">
      <View className="gap-6 rounded-[14px] border border-neutral-150 bg-white p-5 dark:border-theme-dark-border dark:bg-theme-dark-surface">
        <View>
          <Text className="font-display text-lg font-bold text-neutral-900 dark:text-theme-dark-text-primary">
            Relatório diário
          </Text>
          <Text className="mt-1 font-body text-sm text-neutral-700 dark:text-theme-dark-text-secondary">
            {submittedDays} de 7 dias com envio
          </Text>
        </View>

        <View
          accessibilityLabel={`Relatório diário enviado em ${submittedDays} de 7 dias`}
          className="flex-row items-end justify-between"
        >
          {metrics.dailyCheckins.map((day) => (
            <View key={day.date} className="min-w-0 flex-1 items-center gap-2">
              <View className="h-[72px] w-full items-center justify-end">
                <View
                  className={`w-5 rounded-t-[5px] ${
                    day.submitted ? 'bg-brand-dark dark:bg-theme-dark-action' : 'bg-neutral-150 dark:bg-theme-dark-border'
                  }`}
                  style={{ height: day.submitted ? 64 : 12 }}
                />
              </View>
              <Text className="font-body text-[10px] text-neutral-500 dark:text-theme-dark-text-tertiary">
                {weekdayLabel(day.date)}
              </Text>
              <Text className="font-data text-[10px] text-neutral-700 dark:text-theme-dark-text-secondary">
                {dayLabel(day.date)}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-row items-center gap-2 justify-center">
          <View className="h-2.5 w-2.5 rounded-full bg-brand-dark dark:bg-theme-dark-action" />
          <Text className="font-body text-xs text-neutral-700 dark:text-theme-dark-text-secondary">
            Dia com envio
          </Text>
          <View className="ml-3 h-2.5 w-2.5 rounded-full bg-neutral-150 dark:bg-theme-dark-border" />
          <Text className="font-body text-xs text-neutral-700 dark:text-theme-dark-text-secondary">
            Sem envio
          </Text>
        </View>
      </View>

      <View className="gap-4">
        <Text className="font-display text-lg font-bold text-neutral-900 dark:text-theme-dark-text-primary">
          Evolução dos últimos 7 dias
        </Text>
        {metrics.numericFields.length ? (
          metrics.numericFields.map((field) => <FieldTrendCard key={field.fieldId} field={field} />)
        ) : (
          <View className="rounded-[14px] border border-neutral-150 bg-white p-5 dark:border-theme-dark-border dark:bg-theme-dark-surface">
            <Text className="font-body text-sm leading-5 text-neutral-700 dark:text-theme-dark-text-secondary">
              Este procedimento ainda não tem campos numéricos para acompanhar.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function FieldTrendCard({ field }: { field: PatientFieldTrend }) {
  const values = field.dailyAverages.map((item) => item.average);
  const numericValues = values.filter((value): value is number => value !== null);
  const min = numericValues.length ? Math.min(...numericValues) : 0;
  const max = numericValues.length ? Math.max(...numericValues) : 0;
  const points = values.map((value, index) => {
    const x = PLOT_LEFT + (index * (PLOT_RIGHT - PLOT_LEFT)) / Math.max(1, values.length - 1);
    const y = value === null
      ? null
      : max === min
        ? (PLOT_TOP + PLOT_BOTTOM) / 2
        : PLOT_BOTTOM - ((value - min) / (max - min)) * (PLOT_BOTTOM - PLOT_TOP);
    return { x, y, value };
  });
  const linePath = points.map((point, index) => {
    if (point.y === null) return '';
    const previousPoint = points[index - 1];
    const command = previousPoint?.y === null || previousPoint === undefined ? 'M' : 'L';
    return `${command} ${point.x} ${point.y}`;
  }).filter(Boolean).join(' ');
  const hasValues = numericValues.length > 0;

  return (
    <View className="gap-3 rounded-[14px] border border-neutral-150 bg-white p-5 dark:border-theme-dark-border dark:bg-theme-dark-surface">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-display text-lg font-bold text-neutral-900 dark:text-theme-dark-text-primary">
            {field.name}
          </Text>
          <Text className="mt-1 font-body text-xs text-neutral-500 dark:text-theme-dark-text-tertiary">
            {field.dataType === 'SCALE' ? 'Escala' : 'Média diária'}
            {field.unit ? ` - ${field.unit}` : ''}
          </Text>
        </View>
        {hasValues ? (
          <Text className="font-data text-xl font-semibold text-brand-dark dark:text-theme-dark-action">
            {formatValue(numericValues[numericValues.length - 1])}
          </Text>
        ) : null}
      </View>

      {hasValues ? (
        <>
          <Svg
            accessibilityLabel={`Evolução de ${field.name} nos últimos 7 dias`}
            height={CHART_HEIGHT}
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            width="100%"
          >
            {[0, 1, 2].map((step) => {
              const y = PLOT_TOP + (step * (PLOT_BOTTOM - PLOT_TOP)) / 2;
              return (
                <Line
                  key={step}
                  stroke={colors.neutral150}
                  strokeDasharray="3 4"
                  strokeWidth={1}
                  x1={PLOT_LEFT}
                  x2={PLOT_RIGHT}
                  y1={y}
                  y2={y}
                />
              );
            })}
            <Path d={linePath} fill="none" stroke={colors.primary} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
            {points.map((point, index) => point.y === null ? null : (
              <Circle key={field.dailyAverages[index].date} cx={point.x} cy={point.y} fill={colors.primary} r={4} />
            ))}
          </Svg>

          <View className="flex-row justify-between">
            {field.dailyAverages.map((item) => (
              <View key={item.date} className="flex-1 items-center">
                <Text className="font-body text-[10px] text-neutral-500 dark:text-theme-dark-text-tertiary">
                  {weekdayLabel(item.date)}
                </Text>
                <Text className="mt-1 font-data text-[10px] text-neutral-700 dark:text-theme-dark-text-secondary">
                  {item.average === null ? '—' : formatValue(item.average)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text className="font-body text-sm text-neutral-500 dark:text-theme-dark-text-tertiary">
          Ainda não há dados para este período.
        </Text>
      )}
    </View>
  );
}

function weekdayLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

function dayLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit' });
}

function formatValue(value: number): string {
  return formatDecimal(value);
}
