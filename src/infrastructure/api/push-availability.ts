import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

/**
 * O push remoto do `expo-notifications` foi removido do Expo Go no Android a
 * partir do SDK 53. O pacote lança durante a *avaliação do módulo* nesse
 * cenário (`warnOfExpoGoPushUsage` é chamado por um efeito de import em
 * `DevicePushTokenAutoRegistration.fx`), por isso nenhuma guarda em runtime
 * resolve sozinha: o import de `expo-notifications` precisa ser dinâmico e
 * ficar atrás desta flag.
 *
 * `isRunningInExpoGo` é a mesma função que o `expo-notifications` usa
 * internamente, o que garante que esta checagem e a do pacote concordem.
 */
export const isPushSupported = !(isRunningInExpoGo() && Platform.OS === 'android');

/** Tipo do módulo carregado sob demanda. `import type` não gera require. */
export type NotificationsModule = typeof import('expo-notifications');

/**
 * Carrega `expo-notifications` apenas onde o push é suportado. Retorna null no
 * Expo Go Android, deixando os chamadores seguirem o caminho "paciente sem
 * push" em vez de quebrar a inicialização do app.
 */
export async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!isPushSupported) return null;
  return await import('expo-notifications');
}
