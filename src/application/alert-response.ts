import { router } from 'expo-router';

import type { AlertAnswer, AlertResponseResult } from '@/src/domain/alert';
import { ApiClientError } from '@/src/infrastructure/api/api-client';
import { createApiClient } from '@/src/infrastructure/api/api-config';
import { notify } from '@/src/shared/notify';

/** Rota da tela de resposta ao alerta grave. */
export const ALERT_RESPONSE_ROUTE = '/responder-alerta';

export type AlertAnswerOutcome =
  | { kind: 'success'; answer: AlertAnswer; result: AlertResponseResult }
  /** 409: resposta já registrada ou prazo vencido. A mensagem vem do backend. */
  | { kind: 'conflict'; message: string }
  /** Rede fora, token expirado ou erro inesperado: a paciente pode tentar de novo. */
  | { kind: 'failure'; message: string };

const SUCCESS_OK_MESSAGE = 'Resposta registrada. Obrigado por confirmar.';
const NETWORK_MESSAGE =
  'Não conseguimos registrar sua resposta agora. Verifique sua conexão e tente novamente.';
const SESSION_MESSAGE = 'Sua sessão expirou. Entre novamente para responder ao alerta.';

/**
 * Envia a resposta da paciente. Não lança: traduz cada falha num `outcome`
 * para que tanto a tela quanto o fluxo de notificação tratem do mesmo jeito.
 */
export async function submitAlertAnswer(
  alertId: string,
  answer: AlertAnswer,
): Promise<AlertAnswerOutcome> {
  try {
    const result = await createApiClient().respondToAlert(alertId, answer);
    return { kind: 'success', answer, result };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.status === 409) {
        return { kind: 'conflict', message: error.message };
      }
      if (error.status === 401) {
        return { kind: 'failure', message: SESSION_MESSAGE };
      }
      return { kind: 'failure', message: error.message || NETWORK_MESSAGE };
    }
    return { kind: 'failure', message: NETWORK_MESSAGE };
  }
}

/**
 * Feedback padrão do resultado, igual na tela e nos botões da notificação:
 * NOT_OK com sucesso leva às orientações; OK mostra confirmação curta;
 * 409 mostra a mensagem do backend; falha mostra erro e deixa tentar de novo.
 */
export function presentAlertAnswerOutcome(outcome: AlertAnswerOutcome): void {
  switch (outcome.kind) {
    case 'success':
      if (outcome.answer === 'NOT_OK') {
        router.replace('/orientacoes-nao-estou-bem');
        return;
      }
      notify.success(SUCCESS_OK_MESSAGE);
      return;
    case 'conflict':
      notify.info(outcome.message, 'Alerta');
      return;
    case 'failure':
      notify.error(outcome.message);
      return;
  }
}

/** Abre a tela de resposta do alerta grave. */
export function openAlertResponseScreen(alertId: string): void {
  router.push({ pathname: ALERT_RESPONSE_ROUTE, params: { alertId } });
}

/**
 * Responde direto pelo botão da notificação. Em caso de falha, abre a tela de
 * resposta para a paciente tentar novamente sem depender da notificação.
 */
export async function answerFromNotificationAction(
  alertId: string,
  answer: AlertAnswer,
): Promise<void> {
  const outcome = await submitAlertAnswer(alertId, answer);
  if (outcome.kind === 'failure') {
    openAlertResponseScreen(alertId);
  }
  presentAlertAnswerOutcome(outcome);
}
