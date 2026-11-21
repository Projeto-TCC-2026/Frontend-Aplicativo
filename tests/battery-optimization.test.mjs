import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

test('requests this app be exempted from Android battery optimization', async context => {
  const calls = [];

  context.mock.module('expo-secure-store', {
    namedExports: {
      getItemAsync: async () => null,
      setItemAsync: async () => {},
      deleteItemAsync: async () => {},
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
      connectToHealthForBackground: async () => ({}),
      readHealthInBackground: async () => ({}),
    },
  });
  context.mock.module('../src/infrastructure/health/smartwatch-ingestion-service.ts', {
    namedExports: { submitSmartwatchSnapshot: async () => {} },
  });

  const nodeRequire = createRequire(import.meta.url);
  globalThis.require = specifier => {
    if (specifier === 'expo-intent-launcher') {
      return {
        ActivityAction: {
          IGNORE_BATTERY_OPTIMIZATION_SETTINGS: 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
          REQUEST_IGNORE_BATTERY_OPTIMIZATIONS: 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
        },
        startActivityAsync: async (action, params) => calls.push({ action, params }),
      };
    }
    return nodeRequire(specifier);
  };

  try {
    const {
      openBatteryOptimizationSettings,
      requestBatteryOptimizationExemption,
    } = await import(
      '../src/infrastructure/health/smartwatch-background-service.ts'
    );
    await requestBatteryOptimizationExemption();
    await openBatteryOptimizationSettings();

    assert.deepEqual(calls, [
      {
        action: 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
        params: { data: 'package:com.tcc26.recuperasaude' },
      },
      {
        action: 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
        params: undefined,
      },
    ]);
  } finally {
    delete globalThis.require;
  }
});
