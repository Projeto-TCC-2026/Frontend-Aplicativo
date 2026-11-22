export type PatientAlert = {
  id: string;
  severity: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: string;
};

/** Prazo, em minutos, para responder a um alerta grave a partir do recebimento. */
export const ALERT_RESPONSE_WINDOW_MINUTES = 10;

export function parseBackendAlertTime(createdAt: string): number {
  const trimmed = createdAt.trim();
  if (!trimmed) return Number.NaN;

  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function formatBackendAlertDate(createdAt: string): string {
  const parsed = parseBackendAlertTime(createdAt);
  if (!Number.isFinite(parsed)) return 'Data indisponível';

  return new Date(parsed).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

export function getAlertResponseRemainingSeconds(
  createdAt: string,
  now = Date.now(),
): number {
  const createdTime = parseBackendAlertTime(createdAt);
  if (!Number.isFinite(createdTime)) return 0;

  const deadline = createdTime + ALERT_RESPONSE_WINDOW_MINUTES * 60 * 1000;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function isAlertResponseAvailable(
  status: string,
  createdAt: string,
  now = Date.now(),
): boolean {
  return needsPatientResponse(status) && getAlertResponseRemainingSeconds(createdAt, now) > 0;
}

export type PaginatedAlerts = {
  content: PatientAlert[];
  totalPages: number;
  totalElements: number;
  number: number;
  last: boolean;
};

/** Status de alerta previstos no contrato do backend. */
export const ALERT_STATUSES = [
  'UNCONFIRMED',
  'AWAITING_PATIENT',
  'PENDING',
  'NOT_CONFIRMED',
  'RESOLVED',
] as const;

export type AlertStatus = (typeof ALERT_STATUSES)[number];

const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  UNCONFIRMED: 'Aguardando nova medição',
  AWAITING_PATIENT: 'Aguardando sua resposta',
  PENDING: 'Seu médico foi avisado',
  NOT_CONFIRMED: 'Não confirmado',
  RESOLVED: 'Resolvido',
};

function normalizeStatus(status: string): string {
  return status.trim().toUpperCase();
}

export function isAlertStatus(status: string): status is AlertStatus {
  return (ALERT_STATUSES as readonly string[]).includes(normalizeStatus(status));
}

/**
 * Rótulo em português do status. Status desconhecido devolve o texto original,
 * para a tela não quebrar quando o backend introduzir um novo valor.
 */
export function describeAlertStatus(status: string): string {
  const normalized = normalizeStatus(status);
  return isAlertStatus(normalized) ? ALERT_STATUS_LABELS[normalized] : status;
}

/** Alertas nesse status esperam a resposta da paciente ("Você está bem?"). */
export function isAwaitingPatientResponse(status: string): boolean {
  return normalizeStatus(status) === 'AWAITING_PATIENT';
}

export function needsPatientResponse(status: string): boolean {
  const normalized = normalizeStatus(status);
  return normalized === 'AWAITING_PATIENT' || normalized === 'UNCONFIRMED';
}

/** Resposta da paciente a um alerta grave. */
export type AlertAnswer = 'OK' | 'NOT_OK';

export type AlertResponseResult = {
  alertStatus: string;
  doctorNotified: boolean;
};
