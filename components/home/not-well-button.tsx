import { Pressable, Text } from 'react-native';

export type NotWellButtonProps = { onPress: () => void };

/** Botão secundário fixo no rodapé da Home. */
export function NotWellButton({ onPress }: NotWellButtonProps) {
  return (
    <Pressable
      accessibilityHint="Abre orientações sobre quando procurar a equipe médica."
      accessibilityLabel="Não estou bem"
      accessibilityRole="button"
      className="min-h-[52px] min-w-11 items-center justify-center rounded-[12px] border-[1.5px] border-semantic-critical bg-white px-4 py-3 active:bg-semantic-critical-bg dark:bg-theme-dark-surface dark:active:bg-theme-dark-critical-background"
      onPress={onPress}
    >
      <Text allowFontScaling className="font-body text-[17px] font-bold text-semantic-critical">
        Não estou bem
      </Text>
    </Pressable>
  );
}
