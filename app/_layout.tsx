import { colors } from '@/constants/design-tokens';
import { isRunningInExpoGo } from 'expo';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Text, useColorScheme } from 'react-native';
import Toast from 'react-native-toast-message';

import { Button, Screen } from '@/components/ui';
import { toastConfig } from '@/components/ui/toast-config';
import {
    answerFromNotificationAction,
    openAlertResponseScreen,
} from '@/src/application/alert-response';
import { createApiClient } from '@/src/infrastructure/api/api-config';
import { isPushSupported, loadNotifications } from '@/src/infrastructure/api/push-availability';
import {
    ensureAndroidNotificationChannel,
    ensureSevereCheckCategory,
    initPushHandlers
} from '@/src/infrastructure/api/push-service';
import {
    getSessionStatus,
    setSessionStatus,
    subscribeToSessionStatus,
    type SessionStatus,
} from '@/src/infrastructure/api/session-state';
import {
    DEFAULT_NOTIFICATION_ACTION,
    isSevereCheckPayload,
    readAlertAnswer,
    readAlertId,
} from '@/src/infrastructure/api/severe-check-notification';
import { notify } from '@/src/shared/notify';
import {
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import type { EventSubscription } from 'expo-modules-core';

import '@/global.css';

if (Platform.OS === 'android' && !isRunningInExpoGo()) {
  // Define a tarefa de coleta antes que o worker em segundo plano possa iniciar o app.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/src/infrastructure/health/smartwatch-background-service');
}

void SplashScreen.preventAutoHideAsync();

/** Interação com uma notificação, normalizada para a fila. */
type NotificationInteraction = {
  identifier: string;
  actionIdentifier: string;
  data: Record<string, unknown> | undefined;
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [sessionStatus, setLocalSessionStatus] = useState<SessionStatus>(getSessionStatus);
  // As telas de alerta só existem na navegação autenticada. Interações que
  // chegam antes da sessão ser restaurada ficam nesta fila (ref, não state,
  // para não disparar renders em cascata a partir do efeito que a esvazia).
  const pendingResponses = useRef<NotificationInteraction[]>([]);
  const [fontsLoaded, fontError] = useFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const restoreStoredSession = useCallback(async () => {
    setSessionStatus('checking');
    try {
      await createApiClient().restoreSession();
    } catch {
      setSessionStatus('error');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSessionStatus(setLocalSessionStatus);
    void restoreStoredSession();
    return unsubscribe;
  }, [restoreStoredSession]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colorScheme === 'dark' ? colors.darkBackground : colors.neutral100);
  }, [colorScheme]);

  // O `Stack` só é renderizado com a sessão autenticada E as fontes resolvidas;
  // antes disso o componente retorna `null` e qualquer push/replace se perde.
  const stackRendered = sessionStatus === 'authenticated' && (fontsLoaded || fontError !== null);
  // Lido dentro do `drainPendingResponses`, que precisa manter identidade
  // estável para não re-registrar os listeners de push a cada render.
  const stackRenderedRef = useRef(stackRendered);

  /** Trata as interações na fila, uma vez que o `Stack` já está renderizado. */
  const drainPendingResponses = useCallback(() => {
    if (!stackRenderedRef.current || pendingResponses.current.length === 0) return;

    const queued = pendingResponses.current;
    pendingResponses.current = [];
    for (const pending of queued) {
      handleNotificationInteraction(pending);
    }
  }, []);

  // O push remoto não existe no Expo Go Android desde o SDK 53 e o import de
  // `expo-notifications` lança na avaliação do módulo naquele ambiente. Por
  // isso o módulo é carregado dinamicamente, só quando há suporte.
  useEffect(() => {
    if (!isPushSupported) return;

    let cancelled = false;
    let subscriptions: EventSubscription[] = [];

    void (async () => {
      const notifications = await loadNotifications();
      if (!notifications || cancelled) return;

      await initPushHandlers();
      await ensureAndroidNotificationChannel();
      await ensureSevereCheckCategory();
      if (cancelled) return;

      // App aberto pela notificação estando encerrado: o listener pode não
      // existir ainda quando a resposta chega, então a última resposta é lida
      // explicitamente no boot.
      try {
        const lastResponse = notifications.getLastNotificationResponse();
        if (lastResponse) {
          enqueueNotificationResponse(
            {
              identifier: lastResponse.notification.request.identifier,
              actionIdentifier: lastResponse.actionIdentifier,
              data: lastResponse.notification.request.content.data,
            },
            pendingResponses,
          );
          notifications.clearLastNotificationResponse();
          drainPendingResponses();
        }
      } catch (error) {
        console.error('Não foi possível ler a última resposta de notificação.', error);
      }

      subscriptions = [
        notifications.addNotificationReceivedListener(notification => {
          const { title, body, data } = notification.request.content;
          if (data?.type === 'SMARTWATCH_DATA_COLLECTED') {
            return;
          }
          // Alerta grave em primeiro plano abre a tela de resposta em vez de
          // só exibir um toast.
          if (isSevereCheckPayload(data)) {
            enqueueNotificationResponse(
              {
                identifier: notification.request.identifier,
                actionIdentifier: DEFAULT_NOTIFICATION_ACTION,
                data,
              },
              pendingResponses,
            );
            drainPendingResponses();
            return;
          }
          if (title || body) {
            notify.info(body ?? '', title ?? undefined);
          }
        }),
        notifications.addNotificationResponseReceivedListener(response => {
          enqueueNotificationResponse(
            {
              identifier: response.notification.request.identifier,
              actionIdentifier: response.actionIdentifier,
              data: response.notification.request.content.data,
            },
            pendingResponses,
          );
          notifications.clearLastNotificationResponse();
          drainPendingResponses();
        }),
      ];
    })();

    return () => {
      cancelled = true;
      subscriptions.forEach(subscription => subscription.remove());
      subscriptions = [];
    };
  }, [drainPendingResponses]);

  // Esvazia a fila quando o `Stack` passa a estar renderizado, cobrindo a
  // interação que chegou antes da sessão ser restaurada ou das fontes carregarem.
  useEffect(() => {
    stackRenderedRef.current = stackRendered;
    drainPendingResponses();
  }, [drainPendingResponses, stackRendered]);

  if (!fontsLoaded && !fontError) return null;
  if (sessionStatus === 'checking') return null;
  if (sessionStatus === 'error') {
    return (
      <Screen className="items-center justify-center gap-4 bg-neutral-100 p-5 dark:bg-theme-dark-background">
        <Text className="font-body text-center text-neutral-700 dark:text-theme-dark-text-secondary">
          Não foi possível verificar sua sessão. Verifique sua conexão e tente novamente.
        </Text>
        <Button onPress={() => void restoreStoredSession()}>Tentar novamente</Button>
      </Screen>
    );
  }

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={sessionStatus === 'authenticated'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="checkin" />
          <Stack.Screen name="components-demo" />
          <Stack.Screen name="responder-alerta" options={{ title: 'Você está bem?' }} />
          <Stack.Screen name="orientacoes-nao-estou-bem" options={{ title: 'Quando procurar a equipe médica' }} />
        </Stack.Protected>
        <Stack.Protected guard={sessionStatus === 'unauthenticated'}>
          <Stack.Screen name="login" />
          <Stack.Screen name="esqueci-a-senha" />
        </Stack.Protected>
      </Stack>
      <Toast config={toastConfig} position="top" topOffset={56} visibilityTime={4000} />
    </>
  );
}

/**
 * Enfileira a interação deduplicando por `identifier` + ação: o mesmo toque
 * pode chegar pelo `getLastNotificationResponse` e pelo listener.
 */
function enqueueNotificationResponse(
  interaction: NotificationInteraction,
  queue: { current: NotificationInteraction[] },
) {
  const alreadyQueued = queue.current.some(
    pending =>
      pending.identifier === interaction.identifier &&
      pending.actionIdentifier === interaction.actionIdentifier,
  );
  if (!alreadyQueued) queue.current = [...queue.current, interaction];
}

/**
 * Trata o toque na notificação e os botões da categoria `severe-check`:
 * botão responde direto ao backend; toque simples abre a tela de resposta.
 * Qualquer outra notificação continua levando à aba de alertas.
 */
function handleNotificationInteraction({ actionIdentifier, data }: NotificationInteraction) {
  const alertId = readAlertId(data);

  if (isSevereCheckPayload(data) && alertId) {
    const answer = readAlertAnswer(actionIdentifier);
    if (answer) {
      void answerFromNotificationAction(alertId, answer);
      return;
    }
    openAlertResponseScreen(alertId);
    return;
  }

  router.push(alertId ? { pathname: '/notificacoes', params: { alertId } } : '/notificacoes');
}
