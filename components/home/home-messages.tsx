import { Pressable, Text, View } from 'react-native';

const CARD_CLASS =
  'gap-3 rounded-[14px] border border-neutral-150 bg-white p-6 dark:border-theme-dark-border dark:bg-theme-dark-surface';
const TITLE_CLASS =
  'font-display text-xl font-bold leading-[26px] text-neutral-900 dark:text-theme-dark-text-primary';
const BODY_CLASS = 'font-body text-base leading-6 text-neutral-700 dark:text-theme-dark-text-secondary';

/** Exibido quando o paciente não tem nenhum procedimento ativo. */
export function NoProcedureCard() {
  return (
    <View className={CARD_CLASS}>
      <Text allowFontScaling className={TITLE_CLASS}>
        Nenhum acompanhamento ativo
      </Text>
      <Text allowFontScaling className={BODY_CLASS}>
        Você ainda não tem um acompanhamento em andamento por aqui. Converse com seu médico para que ele
        inicie o acompanhamento da sua recuperação no aplicativo.
      </Text>
    </View>
  );
}

/** Erro de rede em linguagem simples, sem código técnico. */
export function HomeErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className={CARD_CLASS}>
      <Text allowFontScaling className={TITLE_CLASS}>
        Não foi possível carregar
      </Text>
      <Text accessibilityRole="alert" allowFontScaling className={BODY_CLASS}>
        {message}
      </Text>
      <Pressable
        accessibilityLabel="Tentar carregar novamente"
        accessibilityRole="button"
        className="min-h-11 min-w-11 items-center justify-center self-start rounded-[12px] border-[1.5px] border-brand-dark bg-white px-4 py-3 active:bg-semantic-info-bg dark:border-theme-dark-action dark:bg-theme-dark-surface dark:active:bg-theme-dark-info-background"
        onPress={onRetry}
      >
        <Text
          allowFontScaling
          className="font-body text-base font-bold text-brand-dark dark:text-theme-dark-action"
        >
          Tentar novamente
        </Text>
      </Pressable>
    </View>
  );
}
