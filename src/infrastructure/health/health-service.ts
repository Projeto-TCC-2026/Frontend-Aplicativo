import { Platform } from 'react-native';
import AppleHealthKit, { type HealthKitPermissions, type HealthValue } from 'react-native-health';
import { initialize, readRecords, requestPermission } from 'react-native-health-connect';

export type HealthSnapshot = {
  heartRate: number | null;
  steps: number | null;
  source: 'Apple Health' | 'Health Connect';
};

const iosPermissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.StepCount,
    ],
    write: [],
  },
};

type HealthConnectHeartRateRecord = {
  samples: { beatsPerMinute: number }[];
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

function initAppleHealth(): Promise<void> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(iosPermissions, (error: string) => {
      if (error) {
        reject(new Error(error));
        return;
      }
      resolve();
    });
  });
}

function readAppleHeartRate(): Promise<number | null> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getHeartRateSamples(
      { startDate: new Date(0).toISOString(), ascending: false, limit: 1 },
      (error: string, results: HealthValue[]) => {
        if (error) {
          reject(new Error(error));
          return;
        }
        resolve(results[0]?.value ?? null);
      },
    );
  });
}

function readAppleSteps(): Promise<number | null> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getStepCount(
      { date: new Date().toISOString() },
      (error: string, result: HealthValue) => {
        if (error) {
          reject(new Error(error));
          return;
        }
        resolve(result?.value ?? null);
      },
    );
  });
}

async function readAppleHealth(): Promise<HealthSnapshot> {
  await initAppleHealth();
  const [heartRate, steps] = await Promise.all([readAppleHeartRate(), readAppleSteps()]);
  return { heartRate, steps, source: 'Apple Health' };
}

async function readHealthConnect(): Promise<HealthSnapshot> {
  await initialize();
  await requestPermission([
    { accessType: 'read', recordType: 'HeartRate' },
    { accessType: 'read', recordType: 'Steps' },
  ]);

  const range = todayRange();
  const [heartRateResult, stepsResult] = await Promise.all([
    readRecords('HeartRate', {
      timeRangeFilter: { operator: 'between', ...range },
      ascendingOrder: false,
    }),
    readRecords('Steps', {
      timeRangeFilter: { operator: 'between', ...range },
      ascendingOrder: false,
    }),
  ]);

  const heartRateRecords = heartRateResult.records as HealthConnectHeartRateRecord[];
  const stepsRecords = stepsResult.records as HealthConnectStepsRecord[];
  const latestHeartRate = heartRateRecords[0]?.samples[0]?.beatsPerMinute ?? null;
  const steps = stepsRecords.reduce((total, record) => total + record.count, 0);

  return { heartRate: latestHeartRate, steps, source: 'Health Connect' };
}

export async function connectToHealth(): Promise<HealthSnapshot> {
  if (Platform.OS === 'ios') {
    return readAppleHealth();
  }
  if (Platform.OS === 'android') {
    return readHealthConnect();
  }
  throw new Error('A integração com smartwatch só está disponível no iOS e Android.');
}
