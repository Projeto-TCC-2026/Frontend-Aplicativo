import { Platform } from 'react-native';

import {
  initialize,
  readRecords,
  requestPermission,
} from 'react-native-health-connect';

export type HealthSnapshot = {
  heartRate: number | null;
  steps: number | null;
  source: 'Health Connect';
};

type HealthConnectHeartRateRecord = {
  samples: {
    beatsPerMinute: number;
  }[];
};

type HealthConnectStepsRecord = {
  count: number;
};

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return {
    startTime: start.toISOString(),
    endTime: new Date().toISOString(),
  };
}

async function readHealthConnect(): Promise<HealthSnapshot> {
  const initialized = await initialize();

  if (!initialized) {
    throw new Error('Não foi possível inicializar o Health Connect.');
  }

  await requestPermission([
    {
      accessType: 'read',
      recordType: 'HeartRate',
    },
    {
      accessType: 'read',
      recordType: 'Steps',
    },
  ]);

  const range = todayRange();

  const [heartRateResult, stepsResult] = await Promise.all([
    readRecords('HeartRate', {
      timeRangeFilter: {
        operator: 'between',
        ...range,
      },
      ascendingOrder: false,
    }),
    readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        ...range,
      },
      ascendingOrder: false,
    }),
  ]);

  const heartRateRecords =
    heartRateResult.records as HealthConnectHeartRateRecord[];

  const stepsRecords =
    stepsResult.records as HealthConnectStepsRecord[];

  const latestHeartRate =
    heartRateRecords[0]?.samples[0]?.beatsPerMinute ?? null;

  const steps = stepsRecords.reduce(
    (total, record) => total + record.count,
    0,
  );

  return {
    heartRate: latestHeartRate,
    steps,
    source: 'Health Connect',
  };
}

export async function connectToHealth(): Promise<HealthSnapshot> {
  if (Platform.OS !== 'android') {
    throw new Error(
      'A integração atual com smartwatch utiliza o Health Connect e está disponível apenas no Android.',
    );
  }

  return readHealthConnect();
}