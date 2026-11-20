import { Pressable, Text, View } from 'react-native';

export type CheckinCardProps = {
  onPress: () => void;
  onHelpPress: () => void;
  /** O check-in só fica disponível depois que o status do dia for carregado. */
  available: boolean;
  submittedToday?: boolean;
};

export function CheckinCard({ onPress, onHelpPress, available, submittedToday = false }: CheckinCardProps) {
  const canSubmit = available && !submittedToday;
  const buttonLabel = submittedToday ? 'Enviado hoje' : canSubmit ? 'Fazer check-in' : 'Verificando...';
  const description = submittedToday
    ? 'Seu check-in de hoje foi registrado.'
    : canSubmit
      ? 'Conte como você está se sentindo hoje.'
      : 'Verificando o status de hoje.';
  const statusClasses = submittedToday
    ? 'border-semantic-success/40 bg-semantic-success-bg dark:border-theme-dark-border dark:bg-theme-dark-surface'
    : canSubmit
      ? 'border-neutral-150 bg-white dark:border-theme-dark-border dark:bg-theme-dark-surface'
      : 'border-neutral-150 bg-white dark:border-theme-dark-border dark:bg-theme-dark-surface';

  return (
    <View>
      <View className={`gap-4 rounded-t-lg border p-5 ${statusClasses}`}>
        <View className="gap-1">
          <Text
            allowFontScaling
            className="font-display text-lg font-bold leading-6 text-neutral-900 dark:text-theme-dark-text-primary"
          >
            Check-in diário
          </Text>
          <Text
            allowFontScaling
            className="font-body text-sm leading-5 text-neutral-700 dark:text-theme-dark-text-secondary"
          >
            {description}
          </Text>
        </View>
        <Pressable
          accessibilityHint={submittedToday ? 'O relatório de hoje já foi enviado.' : undefined}
          accessibilityLabel={buttonLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          className={`min-h-12 min-w-11 items-center justify-center rounded-[9px] px-4 py-3 ${canSubmit
            ? 'bg-semantic-attention active:opacity-80 dark:bg-[#59451E]'
            : submittedToday
              ? 'bg-neutral-300 dark:bg-theme-dark-border'
              : 'bg-neutral-300 dark:bg-theme-dark-border'
            }`}
          disabled={!canSubmit}
          onPress={onPress}
        >
          <Text
            allowFontScaling
            className={`font-body text-sm font-semibold ${canSubmit
              ? 'text-neutral-900 dark:text-theme-dark-text-primary'
              : 'text-white dark:text-theme-dark-text-primary'
              }`}
          >
            {buttonLabel}
          </Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityLabel="Precisa de ajuda?"
        accessibilityRole="button"
        className="flex flex-row align-center justify-center border border-neutral-300 rounded-b-lg border-t-0 w-full py-3 dark:border-theme-dark-border"
        onPress={onHelpPress}
      >
        <Text
          allowFontScaling
          className="font-body text-sm font-medium text-neutral-700 underline dark:text-theme-dark-text-secondary"
        >
          Precisa de ajuda?
        </Text>
      </Pressable>
    </View>
  );
}
