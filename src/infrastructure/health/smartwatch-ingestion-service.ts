import { getPatientId } from '@/src/infrastructure/api/secure-token-store';
import type { HealthSnapshot } from './health-metrics';
import { buildSmartwatchReadings } from './smartwatch-readings';

export async function submitSmartwatchSnapshot(snapshot: HealthSnapshot): Promise<void> {
  const readings = buildSmartwatchReadings(snapshot);
  if (readings.length === 0) return;

  const patientId = await getPatientId();
  if (!patientId) {
    throw new Error('Entre novamente para associar a coleta do smartwatch ao paciente.');
  }

  const ingestionUrl = process.env.EXPO_PUBLIC_MONITORAMENTO_INGESTION_URL?.trim();
  if (!ingestionUrl) {
    throw new Error('EXPO_PUBLIC_MONITORAMENTO_INGESTION_URL não está configurada.');
  }

  const response = await fetch(ingestionUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientId,
      collectedAt: new Date().toISOString(),
      readings,
    }),
  });

  if (!response.ok) {
    throw new Error(`A ingestão dos dados do smartwatch falhou (HTTP ${response.status}).`);
  }

  const result: unknown = await response.json();
  if (
    typeof result === 'object' &&
    result !== null &&
    'failedCount' in result &&
    typeof result.failedCount === 'number' &&
    result.failedCount > 0
  ) {
    throw new Error('A AWS não conseguiu enfileirar todas as leituras do smartwatch.');
  }
}
