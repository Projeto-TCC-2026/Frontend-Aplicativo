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
const SMARTWATCH_CHANNEL_ID = 'recupera-saude.smartwatch-collection';
export const COLLECTION_INTERVAL_MINUTES = 60;
const COLLECTION_NOTIFICATION_TYPE = 'SMARTWATCH_DATA_COLLECTED';
const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';
const LAST_COLLECTED_AT_KEY = 'smartwatch_last_collected_at';

type BackgroundTaskModules = {
  backgroundTask: typeof import('expo-background-task');
  taskManager: typeof import('expo-task-manager');
};

type HealthConnectModule = typeof import('react-native-health-connect');

type MonitoringState = {
  enabled: boolean;
  snapshot: HealthSnapshot | null;
  lastCollectedAt: string | null;
};

function getBackgroundTaskModules(): BackgroundTaskModules {
  return {
    // Load native task modules only in builds that include them.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    backgroundTask: require('expo-background-task') as typeof import('expo-background-task'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    taskManager: require('expo-task-manager') as typeof import('expo-task-manager'),
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
  // Snapshots salvos por versões anteriores não têm os horários de medição:
  // `undefined` é aceito e normalizado para `null` em `normalizeSnapshot`.
  const isOptionalIsoString = (field: unknown) =>
    field === null || field === undefined || typeof field === 'string';

  return (
    isNullableNumber(candidate.heartRate) &&
    isNullableNumber(candidate.oxygenSaturation) &&
    isNullableNumber(candidate.steps) &&
    isOptionalIsoString(candidate.heartRateMeasuredAt) &&
    isOptionalIsoString(candidate.oxygenSaturationMeasuredAt) &&
    candidate.source === 'Health Connect'
  );
}

/** Garante os campos novos em snapshots salvos antes desta versão. */
function normalizeSnapshot(snapshot: HealthSnapshot): HealthSnapshot {
  return {
    ...snapshot,
    heartRateMeasuredAt: snapshot.heartRateMeasuredAt ?? null,
    oxygenSaturationMeasuredAt: snapshot.oxygenSaturationMeasuredAt ?? null,
  };
}

async function saveSnapshot(snapshot: HealthSnapshot): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(LAST_SNAPSHOT_KEY, JSON.stringify(snapshot)),
    SecureStore.setItemAsync(LAST_COLLECTED_AT_KEY, new Date().toISOString()),
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
  const steps =
    snapshot.steps === null
      ? 'sem registro'
      : snapshot.steps.toLocaleString('pt-BR');

  return `FC: ${heartRate} · SpO₂: ${oxygenSaturation} · Passos: ${steps}`;
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

if (Platform.OS === 'android' && !isRunningInExpoGo()) {
  const { backgroundTask, taskManager } = getBackgroundTaskModules();

  taskManager.defineTask(SMARTWATCH_TASK_NAME, async ({ error }) => {
    if (error) {
      console.error('Falha ao iniciar a tarefa de coleta do smartwatch.', error);
      return backgroundTask.BackgroundTaskResult.Failed;
    }

    try {
      await collectAutomatically();
      return backgroundTask.BackgroundTaskResult.Success;
    } catch (taskError) {
      console.error('Falha na coleta automática do smartwatch.', taskError);
      return backgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function getSmartwatchMonitoringState(): Promise<MonitoringState> {
  const [enabled, savedSnapshot, lastCollectedAt] = await Promise.all([
    getCollectionEnabled(),
    SecureStore.getItemAsync(LAST_SNAPSHOT_KEY),
    SecureStore.getItemAsync(LAST_COLLECTED_AT_KEY),
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

  return { enabled, snapshot, lastCollectedAt };
}

export async function enableSmartwatchMonitoring(): Promise<HealthSnapshot> {
  if (Platform.OS !== 'android' || isRunningInExpoGo()) {
    throw new Error(
      'A coleta em segundo plano requer Android e uma versão de desenvolvimento ou de produção do aplicativo.',
    );
  }

  // Health Connect disponível? (antes de qualquer outra coisa)
  await assertHealthConnectAvailable();

  const { backgroundTask, taskManager } = getBackgroundTaskModules();

  if (!(await taskManager.isAvailableAsync())) {
    throw new Error('A coleta em segundo plano não está disponível neste dispositivo.');
  }

  if (
    (await backgroundTask.getStatusAsync()) !==
    backgroundTask.BackgroundTaskStatus.Available
  ) {
    throw new Error('O sistema não permite executar tarefas em segundo plano.');
  }

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
  await SecureStore.setItemAsync(COLLECTION_ENABLED_KEY, 'true');

  try {
    await backgroundTask.registerTaskAsync(SMARTWATCH_TASK_NAME, {
      minimumInterval: COLLECTION_INTERVAL_MINUTES,
    });
    await notifyDataCollected(snapshot);
    return snapshot;
  } catch (error) {
    await SecureStore.setItemAsync(COLLECTION_ENABLED_KEY, 'false');
    try {
      await backgroundTask.unregisterTaskAsync(SMARTWATCH_TASK_NAME);
    } catch (unregisterError) {
      console.error('Não foi possível cancelar a tarefa após falha ao habilitar.', unregisterError);
    }
    throw error;
  }
}

export async function disableSmartwatchMonitoring(): Promise<void> {
  await SecureStore.setItemAsync(COLLECTION_ENABLED_KEY, 'false');

  if (Platform.OS === 'android' && !isRunningInExpoGo()) {
    const { backgroundTask } = getBackgroundTaskModules();
    try {
      await backgroundTask.unregisterTaskAsync(SMARTWATCH_TASK_NAME);
    } catch (error) {
      // Se a task já não estava registrada, não há nada a cancelar.
      console.error('Não foi possível cancelar a tarefa de coleta.', error);
    }
  }
}