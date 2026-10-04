import { Platform } from 'react-native';

import {
    getGrantedPermissions,
    getSdkStatus,
    initialize,
    readRecords,
    requestPermission,
    SdkAvailabilityStatus,
    type BackgroundAccessPermission,
    type Permission,
} from 'react-native-health-connect';

export type HealthSnapshot = {
  heartRate: number | null;
  /**
   * Horário do próprio registro do Health Connect (amostra escolhida de
   * frequência cardíaca), em ISO 8601 UTC. `null` quando não há leitura ou
   * quando o horário vindo do provedor não é uma data válida.
   */
  heartRateMeasuredAt: string | null;
  oxygenSaturation: number | null;
  /** Horário do registro de oxigenação usado, em ISO 8601 UTC. */
  oxygenSaturationMeasuredAt: string | null;
  steps: number | null;
  source: 'Health Connect';
};

const HEALTH_READ_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'OxygenSaturation' },
  { accessType: 'read', recordType: 'Steps' },
];

const BACKGROUND_READ_PERMISSION: BackgroundAccessPermission = {
  accessType: 'read',
  recordType: 'BackgroundAccessPermission',
};

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return {
    startTime: start.toISOString(),
    endTime: new Date().toISOString(),
  };
}

function assertAndroidSupport(): void {
  if (Platform.OS !== 'android') {
    throw new Error(
      'A integração atual com smartwatch utiliza o Health Connect e está disponível apenas no Android.',
    );
  }
}

/** Só verifica se o Health Connect existe e está atualizado (não inicializa). */
export async function assertHealthConnectAvailable(): Promise<void> {
  const status = await getSdkStatus();

  if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
    throw new Error('O Health Connect não é compatível com este dispositivo.');
  }

  if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
    throw new Error(
      'O Health Connect precisa ser instalado ou atualizado na Play Store para continuar.',
    );
  }
}

async function initializeHealthConnect(): Promise<void> {
  await assertHealthConnectAvailable();

  const initialized = await initialize();
  if (!initialized) {
    throw new Error('Não foi possível inicializar o Health Connect.');
  }
}

/**
 * Pede todas as permissões numa única tela e confere o que foi realmente concedido
 * (o usuário pode negar algumas, e a leitura falharia depois).
 */
async function requestAndVerifyPermissions(includeBackground: boolean): Promise<void> {
  const requested = includeBackground
    ? [...HEALTH_READ_PERMISSIONS, BACKGROUND_READ_PERMISSION]
    : HEALTH_READ_PERMISSIONS;

  const granted = await requestPermission(requested);
  const hasPermission = (recordType: string) =>
    granted.some(permission => permission.recordType === recordType);

  if (!HEALTH_READ_PERMISSIONS.every(permission => hasPermission(permission.recordType))) {
    throw new Error(
      'Permita a leitura de frequência cardíaca, saturação de oxigênio e passos no Health Connect.',
    );
  }

  if (includeBackground && !hasPermission('BackgroundAccessPermission')) {
    throw new Error(
      'Permita o acesso em segundo plano ao Health Connect para habilitar a coleta automática. ' +
      'Se a opção não aparecer, atualize o Health Connect na Play Store.',
    );
  }
}

/**
 * Normaliza o horário vindo do Health Connect para ISO 8601 UTC com "Z".
 * O provedor devolve strings com offset local (ex.: `2026-10-04T08:12:00-03:00`),
 * e a ingestão espera UTC. Retorna `null` quando a data é inválida ou ausente.
 */
function toUtcIsoString(time: string | null | undefined): string | null {
  if (!time) return null;
  const parsed = Date.parse(time);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

/** Amostra de frequência cardíaca mais recente, com o horário do próprio registro. */
function latestHeartRate(
  records: { samples: { time: string; beatsPerMinute: number }[] }[],
): { beatsPerMinute: number; measuredAt: string | null } | null {
  let latest: { time: number; bpm: number; rawTime: string } | null = null;

  for (const record of records) {
    for (const sample of record.samples) {
      const time = Date.parse(sample.time);
      if (Number.isNaN(time)) continue;
      if (latest === null || time > latest.time) {
        latest = { time, bpm: sample.beatsPerMinute, rawTime: sample.time };
      }
    }
  }

  if (latest === null) return null;
  return { beatsPerMinute: latest.bpm, measuredAt: toUtcIsoString(latest.rawTime) };
}

// Assume que o Health Connect já foi inicializado por quem chamou.
async function readHealthConnect(): Promise<HealthSnapshot> {
  const range = todayRange();
  const timeRangeFilter = { operator: 'between', ...range } as const;

  const [heartRateResult, oxygenResult, stepsResult] = await Promise.all([
    readRecords('HeartRate', { timeRangeFilter, ascendingOrder: false }),
    readRecords('OxygenSaturation', { timeRangeFilter, ascendingOrder: false }),
    readRecords('Steps', { timeRangeFilter, ascendingOrder: false }),
  ]);

  const steps = stepsResult.records.reduce(
    (total, record) => total + record.count,
    0,
  );

  // `ascendingOrder: false` já devolve o registro mais recente primeiro.
  const heartRate = latestHeartRate(heartRateResult.records);
  const oxygenRecord = oxygenResult.records[0] ?? null;

  return {
    heartRate: heartRate?.beatsPerMinute ?? null,
    heartRateMeasuredAt: heartRate?.measuredAt ?? null,
    oxygenSaturation: oxygenRecord?.percentage ?? null,
    oxygenSaturationMeasuredAt: toUtcIsoString(oxygenRecord?.time),
    steps,
    source: 'Health Connect',
  };
}

export async function connectToHealth(): Promise<HealthSnapshot> {
  assertAndroidSupport();
  await initializeHealthConnect();
  await requestAndVerifyPermissions(false);
  return readHealthConnect();
}

export async function connectToHealthForBackground(): Promise<HealthSnapshot> {
  assertAndroidSupport();
  await initializeHealthConnect();
  await requestAndVerifyPermissions(true);
  return readHealthConnect();
}

export async function readHealthInBackground(): Promise<HealthSnapshot> {
  assertAndroidSupport();
  await initializeHealthConnect();

  const grantedPermissions = await getGrantedPermissions();
  const hasBackgroundAccess = grantedPermissions.some(
    permission => permission.recordType === 'BackgroundAccessPermission',
  );

  if (!hasBackgroundAccess) {
    throw new Error('O acesso em segundo plano ao Health Connect foi removido.');
  }

  return readHealthConnect();
}