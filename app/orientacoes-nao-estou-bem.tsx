import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';

import { Screen } from '@/components/ui';
import { colors } from '@/constants/design-tokens';

const WARNING_SIGNS = ['Febre', 'Dor intensa', 'Falta de ar', 'Sangramento', 'Vermelhidão na ferida'];

const CARD_CLASS =
  'gap-3 rounded-[14px] border border-neutral-150 bg-white p-6 dark:border-theme-dark-border dark:bg-theme-dark-surface';
const TITLE_CLASS =
  'font-display text-xl font-bold leading-[26px] text-neutral-900 dark:text-theme-dark-text-primary';
const BODY_CLASS = 'font-body text-base leading-6 text-neutral-700 dark:text-theme-dark-text-secondary';

/** Tela estática de orientações. Sem telefone e sem integração. */
export default function NotWellGuidance() {
  const colorScheme = useColorScheme();
  const backIconColor = colorScheme === 'dark' ? colors.darkTextPrimary : colors.neutral900;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/' as never);
  }

  return (
    <Screen className="bg-neutral-100 dark:bg-theme-dark-background">
      <ScrollView contentContainerClassName="flex-grow gap-6 p-6 pb-8" showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center self-start rounded-[12px] bg-white active:bg-neutral-150 dark:bg-theme-dark-surface dark:active:bg-theme-dark-border"
          hitSlop={8}
          onPress={goBack}
        >
          <Ionicons color={backIconColor} name="arrow-back" size={24} />
        </Pressable>

        <Text
          allowFontScaling
          className="font-display text-[28px] font-extrabold leading-9 text-neutral-900 dark:text-theme-dark-text-primary"
        >
          Quando procurar a equipe médica
        </Text>

        <View className={CARD_CLASS}>
          <Text allowFontScaling className={BODY_CLASS}>
            Alguns sintomas precisam ser comunicados imediatamente à equipe que acompanha a sua recuperação.
            Eles podem indicar uma complicação que precisa de avaliação rápida, mesmo que você esteja se
            sentindo bem no resto do dia.
          </Text>
        </View>

        <View className={CARD_CLASS}>
          <Text allowFontScaling className={TITLE_CLASS}>
            Avise a equipe imediatamente se tiver
          </Text>
          <View className="gap-3">
            {WARNING_SIGNS.map((sign) => (
              <View
                key={sign}
                className="min-h-11 flex-row items-center gap-3 rounded-[12px] bg-semantic-critical-bg px-4 py-3 dark:bg-theme-dark-critical-background"
              >
                <Ionicons color={colors.critical} name="alert-circle" size={20} />
                <Text
                  allowFontScaling
                  className="flex-1 font-body text-base font-semibold leading-[22px] text-neutral-900 dark:text-theme-dark-text-primary"
                >
                  {sign}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={CARD_CLASS}>
          <Text allowFontScaling className={TITLE_CLASS}>
            Enquanto isso
          </Text>
          <Text allowFontScaling className={BODY_CLASS}>
            Registre o que você está sentindo no seu check-in diário, com o máximo de detalhe possível. Isso
            ajuda a equipe a entender como o sintoma começou e o que mudou desde o último registro. Se o
            sintoma piorar ou aparecer de repente, não espere o próximo check-in para comunicar a equipe.
          </Text>
        </View>

        <View className={CARD_CLASS}>
          <Text allowFontScaling className={BODY_CLASS}>
            Em caso de emergência, procure atendimento médico presencial no serviço de saúde mais próximo.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
