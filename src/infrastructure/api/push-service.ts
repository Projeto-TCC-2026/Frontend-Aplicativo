import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { createApiClient } from './api-config';
import { isPushSupported, loadNotifications } from './push-availability';
import {
    clearRegisteredPushToken,
    getRegisteredPushToken,
    hasPushTokenChanged,
    saveRegisteredPushToken,
} from './push-token-store';

export const ANDROID_ALERT_CHANNEL_ID = 'recupera-saude.clinical-alerts';

/**
 * Categoria do push de alerta grave, combinada com o backend
 * (`categoryId: "severe-check"`). Sem `:` nem `-` no início/fim conforme a
 * recomendação do `setNotificationCategoryAsync`.
 */
export const SEVERE_CHECK_CATEGORY_ID = 'severe-check';

/** `data.type` do push de alerta grave. */
export const SEVERE_CHECK_NOTIFICATION_TYPE = 'SEVERE_CHECK';

/** Identificadores das ações, iguais aos valores aceitos no corpo da resposta. */
export const SEVERE_CHECK_ACTION_OK = 'OK';
export const SEVERE_CHECK_ACTION_NOT_OK = 'NOT_OK';

/** Plataforma enviada ao Backend no registro do device. */
export type PushPlatform = 'ANDROID';

export { isPushSupported };

/**
 * Registra a categoria com os dois botões do alerta grave.
 *
 * `opensAppToForeground: true` (padrão da lib) é mantido de propósito: a
 * documentação do `NotificationAction.options` diz que, com `false`, os
 * listeners de `NotificationResponseReceived` não disparam quando o app foi
 * encerrado (não apenas em background). Trazendo o app para o primeiro plano,
 * a resposta é tratada pelo listener/`getLastNotificationResponse` de forma
 * confiável.
 *
 * Idempotente: chamar de novo sobrescreve a categoria com o mesmo id.
 */
export async function ensureSevereCheckCategory(): Promise<void> {
  const notifications = await loadNotifications();
  if (!notifications) return;

  try {
    await notifications.setNotificationCategoryAsync(SEVERE_CHECK_CATEGORY_ID, [
      {
        identifier: SEVERE_CHECK_ACTION_OK,
        buttonTitle: 'Estou bem',
        options: { opensAppToForeground: true },
      },
      {
        identifier: SEVERE_CHECK_ACTION_NOT_OK,
        buttonTitle: 'Não estou bem',
        options: { opensAppToForeground: true },
      },
    ]);
  } catch (error) {
    // Sem os botões a paciente ainda responde tocando na notificação e
    // abrindo a tela de resposta, então a falha não pode quebrar o boot.
    console.error('Não foi possível registrar a categoria do alerta grave.', error);
  }
}

/**
 * Registra o handler de primeiro plano. Antes isso rodava no escopo do módulo,
 * o que quebrava a inicialização no Expo Go Android; agora é explícito e só é
 * chamado onde o push existe.
 *
 * Pushes em primeiro plano continuam usando toast para evitar banners
 * duplicados; notificações locais da coleta do smartwatch exibem banner.
 * O som é mantido para alertas clínicos.
 */
export async function initPushHandlers(): Promise<void> {
  const notifications = await loadNotifications();
  if (!notifications) return;

  notifications.setNotificationHandler({
    handleNotification: async notification => ({
      shouldShowBanner:
        notification.request.content.data?.type === 'SMARTWATCH_DATA_COLLECTED',
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Canal Android usado por todas as notificações do app. Importância MAX para
 * o alerta aparecer como heads-up, com som e vibração, por ser conteúdo clínico.
 * No Android o canal é imutável após criado: mudar som ou importância exige
 * reinstalar o app ou criar um canal com outro id.
 */
export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const notifications = await loadNotifications();
  if (!notifications) return;

  await notifications.setNotificationChannelAsync(ANDROID_ALERT_CHANNEL_ID, {
    name: 'Alertas de saúde',
    importance: notifications.AndroidImportance.MAX,
    lockscreenVisibility: notifications.AndroidNotificationVisibility.PUBLIC,
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
    const notifications = await loadNotifications();
    if (!notifications) return false;

    const current = await notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;

    const requested = await notifications.requestPermissionsAsync();
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
  const notifications = await loadNotifications();
  if (!notifications) return null;

  const projectId = getExpoProjectId();
  const token = await notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data || null;
}

/**
 * Prepara o canal, garante permissão e devolve o token do dispositivo.
 * Retorna null em emulador, permissão negada ou falha de rede, nunca lança.
 */
export async function getPushToken(): Promise<string | null> {
  if (!isPushSupported) return null;
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
