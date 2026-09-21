import { Pressable, Text, View } from 'react-native';

export type CheckinCardProps = {
  onPress: () => void;
  /** Quando falso, o botão fica desabilitado com o texto "Em breve". */
  available: boolean;
};

export function CheckinCard({ onPress, available }: CheckinCardProps) {
  return (
    <View className="gap-4 rounded-[14px] border border-neutral-150 bg-white p-6 dark:border-theme-dark-border dark:bg-theme-dark-surface">
      <Text
        allowFontScaling
        className="font-display text-xl font-bold leading-[26px] text-neutral-900 dark:text-theme-dark-text-primary"
      >
        Como você está hoje?
      </Text>

      <Pressable
        accessibilityHint={available ? undefined : 'O check-in diário ainda não está disponível.'}
        accessibilityLabel={available ? 'Fazer check-in diário' : 'Check-in diário em breve'}
        accessibilityRole="button"
        accessibilityState={{ disabled: !available }}
        className={`min-h-[52px] min-w-11 items-center justify-center rounded-[12px] px-4 py-3 ${
          available
            ? 'bg-brand-dark active:bg-brand-deeper dark:bg-theme-dark-action'
            : 'bg-neutral-300 dark:bg-theme-dark-border'
        }`}
        disabled={!available}
        onPress={onPress}
      >
        <Text
          allowFontScaling
          className={`font-body text-[17px] font-bold ${
            available ? 'text-white dark:text-theme-dark-background' : 'text-neutral-900 dark:text-theme-dark-text-primary'
          }`}
        >
          {available ? 'Fazer check-in' : 'Em breve'}
        </Text>
      </Pressable>
    </View>
  );
}
