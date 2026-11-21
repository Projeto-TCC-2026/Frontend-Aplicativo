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
    type RecordResult,
    type RecordType,
} from 'react-native-health-connect';
import {
  summarizeHealthSamples,
  type HealthSample,
  type HealthSnapshot,
} from './health-metrics';

export type { HealthMetricSummary, HealthSnapshot } from './health-metrics';

type HealthTimeRangeFilter = {
  operator: 'between';
  startTime: string;
  endTime: string;
};

const HEALTH_READ_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'OxygenSaturation' },
  { accessType: 'read', recordType: 'BodyTemperature' },
];

const BACKGROUND_READ_PERMISSION: BackgroundAccessPermission = {
  accessType: 'read',
  recordType: 'BackgroundAccessPermission',
};

async function readAllRecords<T extends RecordType>(
  recordType: T,
  timeRangeFilter: HealthTimeRangeFilter,
): Promise<RecordResult<T>[]> {
  const records: RecordResult<T>[] = [];
  let pageToken: string | undefined;

  do {
    const page = await readRecords(recordType, {
      timeRangeFilter,
      ...(pageToken ? { pageToken } : {}),
    });
    records.push(...page.records);
    pageToken = page.pageToken;
  } while (pageToken);

  return records;
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
  const hasPermission = (required: Permission | BackgroundAccessPermission) =>
    granted.some(
      permission =>
        permission.accessType === required.accessType &&
        permission.recordType === required.recordType,
    );

  if (!HEALTH_READ_PERMISSIONS.every(hasPermission)) {
    throw new Error(
      'Permita a leitura de frequência cardíaca, saturação de oxigênio e temperatura corporal no Health Connect.',
    );
  }

  if (includeBackground && !hasPermission(BACKGROUND_READ_PERMISSION)) {
    throw new Error(
      'Permita o acesso em segundo plano ao Health Connect para habilitar a coleta automática. ' +
      'Se a opção não aparecer, atualize o Health Connect na Play Store.',
    );
  }
}

// Assume que o Health Connect já foi inicializado por quem chamou.
async function readHealthConnect(): Promise<HealthSnapshot> {
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - 60 * 60 * 1000);
  const range = {
    startTime: windowStart.toISOString(),
    endTime: windowEnd.toISOString(),
  };
  const timeRangeFilter = { operator: 'between', ...range } as const;

  const [heartRateRecords, oxygenRecords, temperatureRecords] = await Promise.all([
    readAllRecords('HeartRate', timeRangeFilter),
    readAllRecords('OxygenSaturation', timeRangeFilter),
    readAllRecords('BodyTemperature', timeRangeFilter),
  ]);

  const heartRateSamples: HealthSample[] = heartRateRecords.flatMap(record =>
    record.samples.map(sample => ({
      value: sample.beatsPerMinute,
      time: sample.time,
    })),
  );
  const oxygenSamples: HealthSample[] = oxygenRecords.map(record => ({
    value: record.percentage,
    time: record.time,
  }));
  const temperatureSamples: HealthSample[] = temperatureRecords.map(record => ({
    value: record.temperature.inCelsius,
    time: record.time,
  }));

  return {
    heartRate: summarizeHealthSamples(heartRateSamples, range.startTime, range.endTime),
    oxygenSaturation: summarizeHealthSamples(oxygenSamples, range.startTime, range.endTime),
    bodyTemperature: summarizeHealthSamples(temperatureSamples, range.startTime, range.endTime),
    windowStart: range.startTime,
    windowEnd: range.endTime,
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
    permission =>
      permission.accessType === BACKGROUND_READ_PERMISSION.accessType &&
      permission.recordType === BACKGROUND_READ_PERMISSION.recordType,
  );

  if (!hasBackgroundAccess) {
    throw new Error('O acesso em segundo plano ao Health Connect foi removido.');
  }

  const hasAllHealthReadPermissions = HEALTH_READ_PERMISSIONS.every(required =>
    grantedPermissions.some(
      permission =>
        permission.accessType === required.accessType &&
        permission.recordType === required.recordType,
    ),
  );
  if (!hasAllHealthReadPermissions) {
    throw new Error(
      'Uma ou mais permissões de leitura de saúde foram removidas. Reative o acesso às métricas no Health Connect.',
    );
  }

  return readHealthConnect();
}