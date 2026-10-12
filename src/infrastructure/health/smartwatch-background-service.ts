import * as SecureStore from 'expo-secure-store';
import { Linking, Platform } from 'react-native';

import { isRunningInExpoGo } from 'expo';

import { loadNotifications } from '@/src/infrastructure/api/push-availability';
import {
    connectToHealthForBackground,
    readHealthInBackground,
    type HealthSnapshot,
} from './health-service';
import { submitSmartwatchSnapshot } from './smartwatch-ingestion-service';

export const SMARTWATCH_TASK_NAME = 'recupera-saude-smartwatch-hourly';

const COLLECTION_ENABLED_KEY = 'smartwatch_collection_enabled';
const LAST_SNAPSHOT_KEY = 'smartwatch_last_health_snapshot';
const COLLECTION_HISTORY_KEY = 'smartwatch_collection_history';
const NEXT_COLLECTION_AT_KEY = 'smartwatch_next_collection_at';
const SMARTWATCH_CHANNEL_ID = 'recupera-saude.smartwatch-collection';
export const COLLECTION_INTERVAL_MINUTES = 60;
const MAX_COLLECTION_HISTORY = 10;
const COLLECTION_RETRY_DELAY_MS = 60_000;
const COLLECTION_NOTIFICATION_TYPE = 'SMARTWATCH_DATA_COLLECTED';
const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';
const LAST_COLLECTED_AT_KEY = 'smartwatch_last_collected_at';
const COLLECTION_INTERVAL_MS = COLLECTION_INTERVAL_MINUTES * 60 * 1000;

type BackgroundServiceModule = {
  service: typeof import('react-native-background-actions').default;
};

type HealthConnectModule = typeof import('react-native-health-connect');

type MonitoringState = {
  enabled: boolean;
  snapshot: HealthSnapshot | null;
  lastCollectedAt: string | null;
  collections: SmartwatchCollection[];
};

export type SmartwatchCollection = {
  collectedAt: string;
  snapshot: HealthSnapshot;
};

let serviceGeneration = 0;
let cancelScheduledWait: (() => void) | null = null;

function getBackgroundServiceModule(): BackgroundServiceModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const backgroundServiceModule = require('react-native-background-actions') as {
    default: typeof import('react-native-background-actions').default;
  };

  return {
    // Load the native service only in builds that include it.
    service: backgroundServiceModule.default,
  };
}

function getHealthConnectModule(): HealthConnectModule {
  // Módulo nativo: só carregar fora do Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-health-connect') as HealthConnectModule;
}

/**
 * 1) Verifica se o Health Connect existe/está atualizado no aparelho.
 *    É esse check que evita o erro genérico "Service not available".
 */
async function assertHealthConnectAvailable(): Promise<void> {
  const { getSdkStatus, SdkAvailabilityStatus } = getHealthConnectModule();
  const status = await getSdkStatus();

  if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return;

  if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
    throw new Error(
      'O Health Connect precisa ser instalado ou atualizado na Play Store para continuar.',
    );
  }

  throw new Error('Este dispositivo não suporta o Health Connect.');
}

/** Abre a Play Store na página do Health Connect (útil quando o status pede instalação/atualização). */
export async function openHealthConnectInPlayStore(): Promise<void> {
  try {
    await Linking.openURL(`market://details?id=${HEALTH_CONNECT_PACKAGE}`);
  } catch {
    await Linking.openURL(
      `https://play.google.com/store/apps/details?id=${HEALTH_CONNECT_PACKAGE}`,
    );
  }
}

/**
 * 2) Verifica a permissão de leitura em segundo plano do Health Connect.
 *    Sem ela, a leitura dentro da task falha mesmo com o app funcionando em primeiro plano.
 *    O tipo é convertido porque ele pode não constar nas tipagens da sua versão da lib
 *    (confirme o nome em node_modules/react-native-health-connect).
 */
const BACKGROUND_PERMISSION = {
  accessType: 'read',
  recordType: 'BackgroundAccessPermission',
} as const;

async function hasBackgroundReadPermission(): Promise<boolean> {
  const { getGrantedPermissions } = getHealthConnectModule();
  const granted = (await getGrantedPermissions()) as unknown as {
    accessType: string;
    recordType: string;
  }[];

  return granted.some(
    (permission) =>
      permission.accessType === BACKGROUND_PERMISSION.accessType &&
      permission.recordType === BACKGROUND_PERMISSION.recordType,
  );
}

async function ensureBackgroundReadPermission(): Promise<void> {
  if (await hasBackgroundReadPermission()) return;

  const { requestPermission } = getHealthConnectModule();
  await requestPermission([
    BACKGROUND_PERMISSION,
  ] as unknown as Parameters<typeof requestPermission>[0]);

  if (!(await hasBackgroundReadPermission())) {
    throw new Error(
      'Permita a leitura de dados em segundo plano no Health Connect para habilitar a coleta automática.',
    );
  }
}

/**
 * 3) Otimização de bateria: o Expo não expõe esse status, então não dá para detectar.
 *    Esta função abre a tela do sistema para o usuário liberar o app (chame a partir da UI,
 *    principalmente em Samsung/One UI). Requer: npx expo install expo-intent-launcher
 */
export async function openBatteryOptimizationSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IntentLauncher = require('expo-intent-launcher') as typeof import('expo-intent-launcher');
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS,
    );
  } catch {
    await Linking.openSettings();
  }
}

function isHealthSnapshot(value: unknown): value is HealthSnapshot {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  const isNullableNumber = (field: unknown) =>
    field === null || (typeof field === 'number' && Number.isFinite(field));
  const isOptionalNullableNumber = (field: unknown) =>
    field === undefined || isNullableNumber(field);
  const isOptionalIsoString = (field: unknown) =>
    field === null || field === undefined || typeof field === 'string';

  return (
    isNullableNumber(candidate.heartRate) &&
    isNullableNumber(candidate.oxygenSaturation) &&
    isOptionalNullableNumber(candidate.bodyTemperature) &&
    (candidate.heartRateStatus === undefined ||
      candidate.heartRateStatus === 'coletado' ||
      candidate.heartRateStatus === 'vazio') &&
    (candidate.oxygenSaturationStatus === undefined ||
      candidate.oxygenSaturationStatus === 'coletado' ||
      candidate.oxygenSaturationStatus === 'vazio') &&
    (candidate.bodyTemperatureStatus === undefined ||
      candidate.bodyTemperatureStatus === 'coletado' ||
      candidate.bodyTemperatureStatus === 'vazio') &&
    isOptionalIsoString(candidate.heartRateMeasuredAt) &&
    isOptionalIsoString(candidate.oxygenSaturationMeasuredAt) &&
    isOptionalIsoString(candidate.bodyTemperatureMeasuredAt) &&
    candidate.source === 'Health Connect'
  );
}

/** Descarta propriedades antigas e normaliza snapshots salvos por versões anteriores. */
function normalizeSnapshot(snapshot: HealthSnapshot): HealthSnapshot {
  return {
    heartRate: snapshot.heartRate,
    heartRateStatus: snapshot.heartRate === null ? 'vazio' : 'coletado',
    heartRateMeasuredAt: snapshot.heartRateMeasuredAt ?? null,
    oxygenSaturation: snapshot.oxygenSaturation,
    oxygenSaturationStatus: snapshot.oxygenSaturation === null ? 'vazio' : 'coletado',
    oxygenSaturationMeasuredAt: snapshot.oxygenSaturationMeasuredAt ?? null,
    bodyTemperature: snapshot.bodyTemperature ?? null,
    bodyTemperatureStatus: snapshot.bodyTemperature == null ? 'vazio' : 'coletado',
    bodyTemperatureMeasuredAt: snapshot.bodyTemperatureMeasuredAt ?? null,
    source: 'Health Connect',
  };
}

async function saveSnapshot(snapshot: HealthSnapshot): Promise<void> {
  const collectedAt = new Date().toISOString();
  const savedHistory = await SecureStore.getItemAsync(COLLECTION_HISTORY_KEY);
  let collections: SmartwatchCollection[] = [];
  if (savedHistory) {
    try {
      const parsed: unknown = JSON.parse(savedHistory);
      if (!Array.isArray(parsed)) throw new Error('Formato do histórico inválido.');
      collections = parsed
        .filter(
          (entry): entry is SmartwatchCollection =>
            typeof entry === 'object' &&
            entry !== null &&
            'collectedAt' in entry &&
            typeof entry.collectedAt === 'string' &&
            'snapshot' in entry &&
            isHealthSnapshot(entry.snapshot),
        )
        .map(entry => ({
          collectedAt: entry.collectedAt,
          snapshot: normalizeSnapshot(entry.snapshot),
        }));
    } catch (error) {
      console.error('Não foi possível ler o histórico de coletas do smartwatch.', error);
    }
  }
  const collection = { collectedAt, snapshot: normalizeSnapshot(snapshot) };

  await Promise.all([
    SecureStore.setItemAsync(LAST_SNAPSHOT_KEY, JSON.stringify(collection.snapshot)),
    SecureStore.setItemAsync(LAST_COLLECTED_AT_KEY, collectedAt),
    SecureStore.setItemAsync(
      COLLECTION_HISTORY_KEY,
      JSON.stringify([collection, ...collections].slice(0, MAX_COLLECTION_HISTORY)),
    ),
  ]);
}

async function getCollectionEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(COLLECTION_ENABLED_KEY)) === 'true';
}

function formatSnapshotForDevelopment(snapshot: HealthSnapshot): string {
  const heartRate =
    snapshot.heartRate === null ? 'sem registro' : `${snapshot.heartRate} bpm`;
  const oxygenSaturation =
    snapshot.oxygenSaturation === null
      ? 'sem registro'
      : `${snapshot.oxygenSaturation}%`;
  const bodyTemperature =
    snapshot.bodyTemperature === null
      ? 'sem registro'
      : `${snapshot.bodyTemperature} °C`;

  return `FC: ${heartRate} · SpO₂: ${oxygenSaturation} · Temperatura: ${bodyTemperature}`;
}

async function notifyDataCollected(snapshot: HealthSnapshot): Promise<void> {
  const notifications = await loadNotifications();

  if (!notifications) {
    throw new Error('As notificações locais não estão disponíveis neste dispositivo.');
  }

  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync(SMARTWATCH_CHANNEL_ID, {
      name: 'Coleta do smartwatch',
      importance: notifications.AndroidImportance.DEFAULT,
    });
  }

  await notifications.scheduleNotificationAsync({
    content: {
      title: 'Coleta automática do smartwatch',
      body: __DEV__
        ? formatSnapshotForDevelopment(snapshot)
        : 'O aplicativo coletou automaticamente seus dados de saúde.',
      data: { type: COLLECTION_NOTIFICATION_TYPE },
    },
    trigger:
      Platform.OS === 'android' ? { channelId: SMARTWATCH_CHANNEL_ID } : null,
  });
}

async function collectAutomatically(): Promise<void> {
  if (!(await getCollectionEnabled())) return;

  // Revalida o ambiente a cada execução: o usuário pode ter revogado permissões
  // ou o Health Connect pode ter sido desinstalado/desatualizado.
  await assertHealthConnectAvailable();
  if (!(await hasBackgroundReadPermission())) {
    throw new Error('Permissão de leitura em segundo plano do Health Connect ausente.');
  }

  const snapshot = await readHealthInBackground();
  if (!(await getCollectionEnabled())) return;

  await saveSnapshot(snapshot);
  await submitSmartwatchSnapshot(snapshot);
  await notifyDataCollected(snapshot);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    let timer: ReturnType<typeof setTimeout>;
    const cancel = () => {
      clearTimeout(timer);
      if (cancelScheduledWait === cancel) cancelScheduledWait = null;
      resolve();
    };
    timer = setTimeout(() => {
      if (cancelScheduledWait === cancel) cancelScheduledWait = null;
      resolve();
    }, milliseconds);
    cancelScheduledWait = cancel;
  });
}

async function runCollectionLoop(
  generation: number,
  initialDelayMs: number,
): Promise<void> {
  let nextCollectionAt = Date.now() + initialDelayMs;

  while (generation === serviceGeneration) {
    let enabled: boolean;
    try {
      enabled = await getCollectionEnabled();
    } catch (error) {
      console.error('Não foi possível verificar se a coleta do smartwatch está ativa.', error);
      await wait(COLLECTION_RETRY_DELAY_MS);
      continue;
    }
    if (!enabled) return;

    const delayMs = Math.max(0, nextCollectionAt - Date.now());
    if (delayMs > 0) await wait(delayMs);
    if (generation !== serviceGeneration) return;
    try {
      if (!(await getCollectionEnabled())) return;
    } catch (error) {
      console.error('Não foi possível verificar se a coleta do smartwatch está ativa.', error);
      await wait(COLLECTION_RETRY_DELAY_MS);
      continue;
    }

    try {
      await collectAutomatically();
    } catch (error) {
      console.error('Falha na coleta automática do smartwatch.', error);
    }

    if (generation !== serviceGeneration) return;

    const now = Date.now();
    nextCollectionAt += COLLECTION_INTERVAL_MS;
    if (nextCollectionAt <= now) {
      nextCollectionAt = now + COLLECTION_INTERVAL_MS;
    }
    try {
      await SecureStore.setItemAsync(NEXT_COLLECTION_AT_KEY, String(nextCollectionAt));
    } catch (error) {
      console.error('Não foi possível salvar o horário da próxima coleta.', error);
    }
  }
}

async function startForegroundService(initialDelayMs: number): Promise<void> {
  const { service } = getBackgroundServiceModule();
  if (service.isRunning()) return;

  const generation = ++serviceGeneration;
  const androidApiLevel =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : Number.parseInt(Platform.Version, 10);
  await service.start(
    () => runCollectionLoop(generation, initialDelayMs),
    {
      taskName: SMARTWATCH_TASK_NAME,
      taskTitle: 'Recupera Saúde',
      taskDesc: 'Monitoramento ativo; coletas aproximadamente a cada hora.',
      taskIcon: { name: 'ic_launcher', type: 'mipmap' },
      color: '#2563EB',
      foregroundServiceType: androidApiLevel >= 34 ? ['health'] : undefined,
    },
  );
}

export async function getSmartwatchMonitoringState(): Promise<MonitoringState> {
  const [enabled, savedSnapshot, lastCollectedAt, savedHistory] = await Promise.all([
    getCollectionEnabled(),
    SecureStore.getItemAsync(LAST_SNAPSHOT_KEY),
    SecureStore.getItemAsync(LAST_COLLECTED_AT_KEY),
    SecureStore.getItemAsync(COLLECTION_HISTORY_KEY),
  ]);

  let snapshot: HealthSnapshot | null = null;
  if (savedSnapshot) {
    try {
      const parsed: unknown = JSON.parse(savedSnapshot);
      if (!isHealthSnapshot(parsed)) {
        throw new Error('Formato da leitura salva inválido.');
      }
      snapshot = normalizeSnapshot(parsed);
    } catch (error) {
      console.error('Não foi possível ler a última coleta do smartwatch.', error);
      await SecureStore.deleteItemAsync(LAST_SNAPSHOT_KEY);
    }
  }

  let collections: SmartwatchCollection[] = [];
  if (savedHistory) {
    try {
      const parsed: unknown = JSON.parse(savedHistory);
      if (!Array.isArray(parsed)) throw new Error('Formato do histórico inválido.');
      collections = parsed
        .filter(
          (entry): entry is SmartwatchCollection =>
            typeof entry === 'object' &&
            entry !== null &&
            'collectedAt' in entry &&
            typeof entry.collectedAt === 'string' &&
            'snapshot' in entry &&
            isHealthSnapshot(entry.snapshot),
        )
        .map(entry => ({
          collectedAt: entry.collectedAt,
          snapshot: normalizeSnapshot(entry.snapshot),
        }))
        .slice(0, MAX_COLLECTION_HISTORY);
    } catch (error) {
      console.error('Não foi possível ler o histórico de coletas do smartwatch.', error);
      await SecureStore.deleteItemAsync(COLLECTION_HISTORY_KEY);
    }
  }
  if (collections.length === 0 && snapshot && lastCollectedAt) {
    collections = [{ collectedAt: lastCollectedAt, snapshot }];
  }

  return { enabled, snapshot, lastCollectedAt, collections };
}

export async function enableSmartwatchMonitoring(): Promise<HealthSnapshot> {
  if (Platform.OS !== 'android' || isRunningInExpoGo()) {
    throw new Error(
      'A coleta em segundo plano requer Android e uma versão de desenvolvimento ou de produção do aplicativo.',
    );
  }

  // Health Connect disponível? (antes de qualquer outra coisa)
  await assertHealthConnectAvailable();

  const notifications = await loadNotifications();
  if (!notifications) {
    throw new Error('As notificações locais não estão disponíveis neste dispositivo.');
  }

  const notificationPermission = await notifications.requestPermissionsAsync();
  if (!notificationPermission.granted) {
    throw new Error(
      'Permita as notificações para receber avisos quando os dados forem coletados.',
    );
  }

  // Inicializa o Health Connect e pede as permissões de leitura (feito em health-service).
  const snapshot = await connectToHealthForBackground();

  // Garante a permissão específica de leitura em segundo plano.
  await ensureBackgroundReadPermission();

  await saveSnapshot(snapshot);
  await submitSmartwatchSnapshot(snapshot);
  const nextCollectionAt = Date.now() + COLLECTION_INTERVAL_MS;
  await SecureStore.setItemAsync(NEXT_COLLECTION_AT_KEY, String(nextCollectionAt));
  await SecureStore.setItemAsync(COLLECTION_ENABLED_KEY, 'true');

  try {
    await notifyDataCollected(snapshot);
    await startForegroundService(Math.max(0, nextCollectionAt - Date.now()));
    return snapshot;
  } catch (error) {
    await SecureStore.setItemAsync(COLLECTION_ENABLED_KEY, 'false');
    await SecureStore.deleteItemAsync(NEXT_COLLECTION_AT_KEY);
    serviceGeneration += 1;
    cancelScheduledWait?.();
    try {
      const { service } = getBackgroundServiceModule();
      if (service.isRunning()) await service.stop();
    } catch (stopError) {
      console.error('Não foi possível parar o serviço após falha ao habilitar.', stopError);
    }
    throw error;
  }
}

export async function resumeSmartwatchMonitoring(): Promise<void> {
  if (Platform.OS !== 'android' || isRunningInExpoGo()) return;
  if (!(await getCollectionEnabled())) return;

  const scheduledAt = Number.parseInt(
    (await SecureStore.getItemAsync(NEXT_COLLECTION_AT_KEY)) ?? '',
    10,
  );
  const initialDelayMs = Number.isFinite(scheduledAt)
    ? Math.max(0, scheduledAt - Date.now())
    : 0;

  await startForegroundService(initialDelayMs);
}

export async function disableSmartwatchMonitoring(): Promise<void> {
  await SecureStore.setItemAsync(COLLECTION_ENABLED_KEY, 'false');
  await SecureStore.deleteItemAsync(NEXT_COLLECTION_AT_KEY);

  if (Platform.OS === 'android' && !isRunningInExpoGo()) {
    serviceGeneration += 1;
    cancelScheduledWait?.();
    try {
      const { service } = getBackgroundServiceModule();
      if (service.isRunning()) await service.stop();
    } catch (error) {
      console.error('Não foi possível parar o serviço de coleta.', error);
    }
  }
}
