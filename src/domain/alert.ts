export type PatientAlert = {
  id: string;
  severity: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: string;
};

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

/** Resposta da paciente a um alerta grave. */
export type AlertAnswer = 'OK' | 'NOT_OK';

export type AlertResponseResult = {
  alertStatus: string;
  doctorNotified: boolean;
};
