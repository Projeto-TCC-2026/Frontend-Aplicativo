import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const hour = 60 * 60 * 1000;

test('runs a background health collection after the one-hour delay', async context => {
  const now = Date.parse('2026-11-20T12:00:00.000Z');
  context.mock.timers.enable({ apis: ['Date', 'setTimeout'], now });

  const values = new Map();
  const snapshot = {
    heartRate: {
      percentile5: 60,
      percentile95: 80,
      percentile5MeasuredAt: '2026-11-20T11:30:00.000Z',
      percentile95MeasuredAt: '2026-11-20T11:45:00.000Z',
      sampleCount: 2,
    },
    oxygenSaturation: {
      percentile5: null,
      percentile95: null,
      percentile5MeasuredAt: null,
      percentile95MeasuredAt: null,
      sampleCount: 0,
    },
    bodyTemperature: {
      percentile5: null,
      percentile95: null,
      percentile5MeasuredAt: null,
      percentile95MeasuredAt: null,
      sampleCount: 0,
    },
    windowStart: '2026-11-20T11:00:00.000Z',
    windowEnd: '2026-11-20T12:00:00.000Z',
    source: 'Health Connect',
  };
  let task;
  let isRunning = false;
  let backgroundReads = 0;
  const service = {
    isRunning: () => isRunning,
    start: async callback => {
      task = callback;
      isRunning = true;
    },
    stop: async () => {
      isRunning = false;
    },
  };

  context.mock.module('expo-secure-store', {
    namedExports: {
      getItemAsync: async key => values.get(key) ?? null,
      setItemAsync: async (key, value) => values.set(key, value),
      deleteItemAsync: async key => values.delete(key),
    },
  });
  context.mock.module('react-native', {
    namedExports: {
      Linking: { openURL: async () => {}, openSettings: async () => {} },
      Platform: { OS: 'android', Version: 35 },
    },
  });
  context.mock.module('expo', {
    namedExports: { isRunningInExpoGo: () => false },
  });
  context.mock.module('../src/infrastructure/health/health-service.ts', {
    namedExports: {
      connectToHealthForBackground: async () => snapshot,
      readHealthInBackground: async () => {
        backgroundReads += 1;
        return snapshot;
      },
    },
  });
  context.mock.module('../src/infrastructure/health/smartwatch-ingestion-service.ts', {
    namedExports: { submitSmartwatchSnapshot: async () => {} },
  });

  const nodeRequire = createRequire(import.meta.url);
  globalThis.require = specifier => {
    if (specifier === 'react-native-background-actions') return { default: service };
    if (specifier === 'react-native-health-connect') {
      return {
        getSdkStatus: async () => 3,
        SdkAvailabilityStatus: { SDK_AVAILABLE: 3 },
        getGrantedPermissions: async () => [
          { accessType: 'read', recordType: 'BackgroundAccessPermission' },
        ],
        requestPermission: async () => [],
      };
    }
    return nodeRequire(specifier);
  };

  try {
    const { disableSmartwatchMonitoring, enableSmartwatchMonitoring } = await import(
      '../src/infrastructure/health/smartwatch-background-service.ts'
    );
    await enableSmartwatchMonitoring();
    assert.equal(backgroundReads, 0, 'the first background read waits for the scheduled hour');

    const taskPromise = task();
    await Promise.resolve();
    context.mock.timers.tick(hour);
    for (let turn = 0; turn < 10; turn += 1) {
      await Promise.resolve();
    }

    assert.equal(backgroundReads, 1, 'the task reads Health Connect after one hour');

    await disableSmartwatchMonitoring();
    await taskPromise;
  } finally {
    delete globalThis.require;
    context.mock.timers.reset();
  }
});
