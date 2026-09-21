import type { PaginatedAlerts, PatientAlert } from '@/src/domain/alert';
import type { PatientProcedureSummaryResponse } from '@/src/domain/patient-procedure';
import { ApiClientError } from '@/src/infrastructure/api/api-client';
import { createApiClient } from '@/src/infrastructure/api/api-config';
import { getPatientFullName } from '@/src/infrastructure/api/secure-token-store';
import type { ApiResponse } from '@/src/shared/types/api';

const PATIENT_PROCEDURES_PATH = '/api/mobile/patient-procedures';
const ALERTS_PATH = '/api/mobile/alerts';

/**
 * Busca os procedimentos do paciente autenticado. O token é injetado pelo
 * `ApiClient`, que lê o `secureTokenStore` em cada request.
 */
export async function fetchPatientProcedures(): Promise<PatientProcedureSummaryResponse[]> {
  const response = await createApiClient().get<ApiResponse<PatientProcedureListPayload>>(
    PATIENT_PROCEDURES_PATH,
  );
  return normalizeProcedureList(unwrap(response));
}

/** Busca os alertas do paciente autenticado. */
export async function fetchPatientAlerts(page = 0, size = 20): Promise<PatientAlert[]> {
  const response = await createApiClient().get<ApiResponse<PatientAlertListPayload>>(
    `${ALERTS_PATH}?page=${page}&size=${size}`,
  );
  return normalizeAlertList(unwrap(response));
}

/**
 * Seleciona o procedimento a exibir: entre os ativos, o de `startDate` mais
 * recente. Sem procedimento ativo, retorna `null`.
 */
export function selectCurrentProcedure(
  procedures: PatientProcedureSummaryResponse[],
): PatientProcedureSummaryResponse | null {
  const active = procedures.filter((procedure) => isActiveStatus(procedure.status));
  if (active.length === 0) return null;

  return active.reduce((mostRecent, candidate) =>
    startTime(candidate) > startTime(mostRecent) ? candidate : mostRecent,
  );
}

export function isActiveStatus(status: string): boolean {
  const normalized = status.toUpperCase();
  return normalized === 'ACTIVE' || normalized === 'ATIVO' || normalized === 'IN_PROGRESS' || normalized === 'EM_ANDAMENTO';
}

/** Alerta aberto, ou seja, ainda não resolvido/fechado pela equipe. */
export function isOpenAlert(alert: PatientAlert): boolean {
  const normalized = alert.status.toUpperCase();
  return normalized === 'OPEN' || normalized === 'ABERTO' || normalized === 'PENDING' || normalized === 'PENDENTE';
}

/** Mensagem em linguagem simples, sem código técnico, para a tela. */
export function describeHomeError(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 401) {
    return 'Sua sessão expirou. Entre novamente para ver seu acompanhamento.';
  }
  return 'Não conseguimos carregar suas informações agora. Verifique sua conexão e tente de novo.';
}

type PatientProcedureListPayload =
  | PatientProcedureSummaryResponse[]
  | { content?: PatientProcedureSummaryResponse[] };

type PatientAlertListPayload = PatientAlert[] | PaginatedAlerts;

function normalizeProcedureList(payload: PatientProcedureListPayload): PatientProcedureSummaryResponse[] {
  if (Array.isArray(payload)) return payload;
  return payload?.content ?? [];
}

function normalizeAlertList(payload: PatientAlertListPayload): PatientAlert[] {
  if (Array.isArray(payload)) return payload;
  return payload?.content ?? [];
}

function startTime(procedure: PatientProcedureSummaryResponse): number {
  const parsed = new Date(procedure.startDate).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === null || response.data === undefined) {
    throw new ApiClientError(500, response.message ?? 'A API não retornou dados.');
  }
  return response.data;
}

/**
 * Primeiro nome do paciente, para a saudação da Home.
 *
 * Lê do armazenamento local, preenchido no login a partir do `fullName` do
 * `PatientAuthResponse`. Não usa `GET /auth/me` porque o `getProfile` do
 * backend não tem ramo para o perfil de paciente: ele cai no retorno base
 * (id, email, role) e o `fullName` volta ausente, por causa do
 * `@JsonInclude(NON_NULL)` no `UserProfileResponse`.
 *
 * Qualquer falha de leitura resulta em `null` e a Home segue funcionando.
 */
export async function fetchPatientFirstName(): Promise<string | null> {
  try {
    return toFirstName(await getPatientFullName());
  } catch (error) {
    console.error('[patient-home] falha ao ler o nome do paciente:', error);
    return null;
  }
}

function toFirstName(fullName: string | null): string | null {
  if (!fullName) return null;
  const first = fullName.trim().split(/\s+/)[0];
  return first ? first : null;
}
