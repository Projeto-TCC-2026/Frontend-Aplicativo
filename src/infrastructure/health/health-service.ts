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
  oxygenSaturation: number | null;
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

function latestHeartRate(
  records: { samples: { time: string; beatsPerMinute: number }[] }[],
): number | null {
  let latest: { time: number; bpm: number } | null = null;

  for (const record of records) {
    for (const sample of record.samples) {
      const time = Date.parse(sample.time);
      if (latest === null || time > latest.time) {
        latest = { time, bpm: sample.beatsPerMinute };
      }
    }
  }

  return latest?.bpm ?? null;
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

  return {
    heartRate: latestHeartRate(heartRateResult.records),
    oxygenSaturation: oxygenResult.records[0]?.percentage ?? null,
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