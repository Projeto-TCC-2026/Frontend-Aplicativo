import { colors } from '@/constants/design-tokens';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import Toast from 'react-native-toast-message';

import { toastConfig } from '@/components/ui/toast-config';
import { isPushSupported, loadNotifications } from '@/src/infrastructure/api/push-availability';
import { ensureAndroidNotificationChannel, initPushHandlers } from '@/src/infrastructure/api/push-service';
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

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
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

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colorScheme === 'dark' ? colors.darkBackground : colors.neutral100);
  }, [colorScheme]);

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
      if (cancelled) return;

      subscriptions = [
        notifications.addNotificationReceivedListener(notification => {
          const { title, body } = notification.request.content;
          if (title || body) {
            notify.info(body ?? '', title ?? undefined);
          }
        }),
        notifications.addNotificationResponseReceivedListener(response => {
          openAlertFromNotification(response.notification.request.content.data);
        }),
      ];
    })();

    return () => {
      cancelled = true;
      subscriptions.forEach(subscription => subscription.remove());
      subscriptions = [];
    };
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        {/* As demais rotas continuam sendo resolvidas automaticamente pelo
            expo-router a partir da pasta app/. */}
        <Stack.Screen name="orientacoes-nao-estou-bem" options={{ title: 'Quando procurar a equipe médica' }} />
      </Stack>
      <Toast config={toastConfig} position="top" topOffset={56} visibilityTime={4000} />
    </>
  );
}

/**
 * Abre a aba de alertas ao tocar na notificação. O `alertId` vem do data
 * payload e é repassado como parâmetro, para a tela destacar o alerta quando
 * houver suporte a esse detalhe.
 */
function openAlertFromNotification(data: Record<string, unknown> | undefined) {
  const alertId = readAlertId(data);
  router.push(alertId ? { pathname: '/notificacoes', params: { alertId } } : '/notificacoes');
}

function readAlertId(data: Record<string, unknown> | undefined): string | null {
  const candidate = data?.alertId ?? data?.alert_id;
  if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  return typeof candidate === 'number' ? String(candidate) : null;
}
