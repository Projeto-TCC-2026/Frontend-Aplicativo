import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, useColorScheme, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { colors } from '@/constants/design-tokens';
import { presentAlertAnswerOutcome, submitAlertAnswer } from '@/src/application/alert-response';
import type { AlertAnswer } from '@/src/domain/alert';

const CARD_CLASS =
  'gap-3 rounded-[14px] border border-neutral-150 bg-white p-6 dark:border-theme-dark-border dark:bg-theme-dark-surface';
const BODY_CLASS = 'font-body text-base leading-6 text-neutral-700 dark:text-theme-dark-text-secondary';

/**
 * Tela de resposta ao alerta grave. Por decisão de produto não exibe nenhum
 * valor de medição: só a pergunta e os dois botões.
 */
export default function RespondToAlert() {
  const params = useLocalSearchParams<{ alertId?: string | string[] }>();
  const alertId = firstParam(params.alertId);
  const colorScheme = useColorScheme();
  const backIconColor = colorScheme === 'dark' ? colors.darkTextPrimary : colors.neutral900;
  const [sending, setSending] = useState<AlertAnswer | null>(null);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/notificacoes');
  }

  async function answer(value: AlertAnswer) {
    if (!alertId || sending) return;
    setSending(value);
    try {
      const outcome = await submitAlertAnswer(alertId, value);
      // NOT_OK com sucesso navega para as orientações; nos outros casos a tela
      // continua aberta para a paciente tentar novamente.
      presentAlertAnswerOutcome(outcome);
      if (outcome.kind === 'success' && value === 'OK') goBack();
    } finally {
      setSending(null);
    }
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
          Você está bem?
        </Text>

        {alertId ? (
          <>
            <View className={CARD_CLASS}>
              <Text allowFontScaling className={BODY_CLASS}>
                Identificamos uma alteração na sua medição mais recente. Nos diga como você está
                agora para a equipe que acompanha sua recuperação saber se precisa agir.
              </Text>
            </View>

            <View className="gap-3">
              <Button
                accessibilityLabel="Estou bem"
                disabled={sending === 'NOT_OK'}
                fullWidth
                loading={sending === 'OK'}
                loadingText="Enviando..."
                onPress={() => void answer('OK')}
                size="lg"
                variant="success"
              >
                Estou bem
              </Button>
              <Button
                accessibilityLabel="Não estou bem"
                disabled={sending === 'OK'}
                fullWidth
                loading={sending === 'NOT_OK'}
                loadingText="Enviando..."
                onPress={() => void answer('NOT_OK')}
                size="lg"
                variant="destructive"
              >
                Não estou bem
              </Button>
            </View>
          </>
        ) : (
          <View className={CARD_CLASS}>
            <Text allowFontScaling className={BODY_CLASS}>
              Não identificamos a qual alerta esta resposta pertence. Abra o alerta na lista de
              alertas para responder.
            </Text>
            <Button fullWidth onPress={() => router.replace('/notificacoes')} variant="secondary">
              Ver meus alertas
            </Button>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function firstParam(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && candidate.trim().length > 0 ? candidate.trim() : null;
}
