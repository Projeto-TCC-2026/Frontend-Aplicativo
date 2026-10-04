import type { AlertAnswer } from '@/src/domain/alert';
import {
    SEVERE_CHECK_ACTION_NOT_OK,
    SEVERE_CHECK_ACTION_OK,
    SEVERE_CHECK_NOTIFICATION_TYPE,
} from './push-service';

/** Identificador de ação usado quando a paciente toca na notificação (sem botão). */
export const DEFAULT_NOTIFICATION_ACTION = 'expo.modules.notifications.actions.DEFAULT';

/** `alertId` do data payload. Aceita number e `alert_id` por tolerância. */
export function readAlertId(data: Record<string, unknown> | undefined): string | null {
  const candidate = data?.alertId ?? data?.alert_id;
  if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate.trim();
  return typeof candidate === 'number' ? String(candidate) : null;
}

/** `true` quando o push é o pedido de resposta de um alerta grave. */
export function isSevereCheckPayload(data: Record<string, unknown> | undefined): boolean {
  return data?.type === SEVERE_CHECK_NOTIFICATION_TYPE;
}

/**
 * Converte o `actionIdentifier` da resposta na resposta da paciente.
 * Retorna `null` para o toque na notificação (ação padrão), caso em que a tela
 * de resposta deve ser aberta.
 */
export function readAlertAnswer(actionIdentifier: string): AlertAnswer | null {
  if (actionIdentifier === SEVERE_CHECK_ACTION_OK) return 'OK';
  if (actionIdentifier === SEVERE_CHECK_ACTION_NOT_OK) return 'NOT_OK';
  return null;
}
