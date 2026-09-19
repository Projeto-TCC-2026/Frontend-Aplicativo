import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { createApiClient } from './api-config';
import {
    clearRegisteredPushToken,
    getRegisteredPushToken,
    hasPushTokenChanged,
    saveRegisteredPushToken,
} from './push-token-store';

export const ANDROID_ALERT_CHANNEL_ID = 'recupera-saude.clinical-alerts';

/** Plataforma enviada ao Backend no registro do device. */
export type PushPlatform = 'ANDROID';

/**
 * Com o app em primeiro plano o banner do sistema é suprimido e o aviso é dado
 * pelo toast in-app, evitando alerta duplicado. O som é mantido para o alerta
 * clínico não passar silencioso. Fora do primeiro plano vale o canal Android.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Canal Android usado por todas as notificações do app. Importância MAX para
 * o alerta aparecer como heads-up, com som e vibração, por ser conteúdo clínico.
 * No Android o canal é imutável após criado: mudar som ou importância exige
 * reinstalar o app ou criar um canal com outro id.
 */
export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_ALERT_CHANNEL_ID, {
    name: 'Alertas de saúde',
    importance: Notifications.AndroidImportance.MAX,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    showBadge: true,
  });
}

/**
 * Solicita a permissão de notificação em runtime. Obrigatório no Android 13+
 * (POST_NOTIFICATIONS). Retorna false quando o paciente nega, sem lançar.
 */
export async function requestPushPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/**
 * Único ponto de captura do token. Trocar o Expo Push Service por FCM direto
 * é substituir a chamada abaixo por `Notifications.getDevicePushTokenAsync()`.
 */
async function fetchPushToken(): Promise<string | null> {
  const projectId = getExpoProjectId();
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data || null;
}

/**
 * Prepara o canal, garante permissão e devolve o token do dispositivo.
 * Retorna null em emulador, permissão negada ou falha de rede, nunca lança.
 */
export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    await ensureAndroidNotificationChannel();
    if (!(await requestPushPermission())) return null;
    return await fetchPushToken();
  } catch {
    return null;
  }
}

/** Identificador estável do dispositivo, enviado como `deviceId` (opcional). */
export function getDeviceId(): string | undefined {
  return Device.osBuildId ?? Device.modelId ?? Device.modelName ?? undefined;
}

export function getPushPlatform(): PushPlatform {
  return 'ANDROID';
}

/** Lê o `projectId` do EAS. Ausente em projetos ainda não vinculados ao EAS. */
function getExpoProjectId(): string | undefined {
  const fromExpoConfig = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromExpoConfig === 'string' && fromExpoConfig.length > 0) return fromExpoConfig;

  const fromEasConfig = Constants.easConfig?.projectId;
  return typeof fromEasConfig === 'string' && fromEasConfig.length > 0 ? fromEasConfig : undefined;
}

/**
 * Registra o token no Backend após o login. Não lança: permissão negada,
 * emulador ou falha de rede apenas deixam o paciente sem push.
 * Retorna o token registrado ou null.
 */
export async function syncPushRegistration(): Promise<string | null> {
  try {
    const token = await getPushToken();
    if (!token) return null;

    if (!(await hasPushTokenChanged(token))) return token;

    await createApiClient().registerPushToken({
      token,
      platform: getPushPlatform(),
      deviceId: getDeviceId(),
    });
    await saveRegisteredPushToken(token);
    return token;
  } catch {
    return null;
  }
}

/**
 * Remove o registro no logout. Tolera 404 (token inexistente ou de outro
 * usuário) e qualquer falha de rede, sempre limpando o token local.
 */
export async function removePushRegistration(): Promise<void> {
  try {
    const token = await getRegisteredPushToken();
    if (token) {
      await createApiClient().unregisterPushToken(token);
    }
  } catch {
    // Logout do paciente não pode depender do sucesso do unregister.
  } finally {
    await clearRegisteredPushToken();
  }
}
