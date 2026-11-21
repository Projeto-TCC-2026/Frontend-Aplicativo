import assert from 'node:assert/strict';
import { test } from 'node:test';

import { summarizeHealthSamples } from '../src/infrastructure/health/health-metrics.ts';
import { buildSmartwatchReadings } from '../src/infrastructure/health/smartwatch-readings.ts';

const WINDOW_START = '2026-11-18T10:00:00.000Z';
const WINDOW_END = '2026-11-18T11:00:00.000Z';

test('calculates nearest-rank P5 and P95 from samples inside the collection window', () => {
  const samples = Array.from({ length: 100 }, (_, index) => ({
    value: index + 1,
    time: new Date(Date.parse(WINDOW_START) + index * 30_000).toISOString(),
  }));
  samples.push(
    { value: -100, time: '2026-11-18T09:59:59.999Z' },
    { value: 1000, time: '2026-11-18T11:00:00.001Z' },
    { value: Number.NaN, time: '2026-11-18T10:30:00.000Z' },
    { value: 900, time: 'not-a-date' },
  );

  assert.deepEqual(
    summarizeHealthSamples(samples, WINDOW_START, WINDOW_END),
    {
      percentile5: 5,
      percentile95: 95,
      percentile5MeasuredAt: new Date(Date.parse(WINDOW_START) + 4 * 30_000).toISOString(),
      percentile95MeasuredAt: new Date(Date.parse(WINDOW_START) + 94 * 30_000).toISOString(),
      sampleCount: 100,
    },
  );
});

test('returns one sample for both percentiles and an explicit zero count for an empty window', () => {
  const sample = { value: 72, time: '2026-11-18T10:30:00.000Z' };

  assert.deepEqual(
    summarizeHealthSamples([sample], WINDOW_START, WINDOW_END),
    {
      percentile5: 72,
      percentile95: 72,
      percentile5MeasuredAt: sample.time,
      percentile95MeasuredAt: sample.time,
      sampleCount: 1,
    },
  );
  assert.deepEqual(
    summarizeHealthSamples([], WINDOW_START, WINDOW_END),
    {
      percentile5: null,
      percentile95: null,
      percentile5MeasuredAt: null,
      percentile95MeasuredAt: null,
      sampleCount: 0,
    },
  );
});

test('rounds percentile values to at most two decimal places', () => {
  const samples = [
    { value: 36.123456, time: '2026-11-18T10:10:00.000Z' },
    { value: 36.987654, time: '2026-11-18T10:20:00.000Z' },
  ];

  assert.deepEqual(
    summarizeHealthSamples(samples, WINDOW_START, WINDOW_END),
    {
      percentile5: 36.12,
      percentile95: 36.99,
      percentile5MeasuredAt: '2026-11-18T10:10:00.000Z',
      percentile95MeasuredAt: '2026-11-18T10:20:00.000Z',
      sampleCount: 2,
    },
  );
});

test('counts one sample per timestamp so the Backend idempotency key preserves both bounds', () => {
  const sameTime = '2026-11-18T10:30:00.000Z';

  assert.deepEqual(
    summarizeHealthSamples(
      [
        { value: 60, time: sameTime },
        { value: 120, time: sameTime },
        { value: 80, time: '2026-11-18T10:31:00.000Z' },
      ],
      WINDOW_START,
      WINDOW_END,
    ),
    {
      percentile5: 60,
      percentile95: 80,
      percentile5MeasuredAt: sameTime,
      percentile95MeasuredAt: '2026-11-18T10:31:00.000Z',
      sampleCount: 2,
    },
  );
});

test('builds separate analysis readings for P5 and P95 without duplicating a single sample', () => {
  const snapshot = {
    heartRate: {
      percentile5: 60,
      percentile95: 120,
      percentile5MeasuredAt: '2026-11-18T10:05:00.000Z',
      percentile95MeasuredAt: '2026-11-18T10:55:00.000Z',
      sampleCount: 40,
    },
    oxygenSaturation: {
      percentile5: 94,
      percentile95: 99,
      percentile5MeasuredAt: '2026-11-18T10:15:00.000Z',
      percentile95MeasuredAt: '2026-11-18T10:45:00.000Z',
      sampleCount: 4,
    },
    bodyTemperature: {
      percentile5: 36.2,
      percentile95: 36.8,
      percentile5MeasuredAt: '2026-11-18T10:20:00.000Z',
      percentile95MeasuredAt: '2026-11-18T10:40:00.000Z',
      sampleCount: 2,
    },
    source: 'Health Connect',
  };

  assert.deepEqual(buildSmartwatchReadings(snapshot), [
    { type: 'heartRate', value: 60, unit: 'bpm', measuredAt: '2026-11-18T10:05:00.000Z' },
    { type: 'heartRate', value: 120, unit: 'bpm', measuredAt: '2026-11-18T10:55:00.000Z' },
    { type: 'spo2', value: 94, unit: '%', measuredAt: '2026-11-18T10:15:00.000Z' },
    { type: 'spo2', value: 99, unit: '%', measuredAt: '2026-11-18T10:45:00.000Z' },
    { type: 'temperature', value: 36.2, unit: 'celsius', measuredAt: '2026-11-18T10:20:00.000Z' },
    { type: 'temperature', value: 36.8, unit: 'celsius', measuredAt: '2026-11-18T10:40:00.000Z' },
  ]);
});

test('does not send an identical P5/P95 measurement twice', () => {
  const snapshot = {
    heartRate: {
      percentile5: 72,
      percentile95: 72,
      percentile5MeasuredAt: '2026-11-18T10:30:00.000Z',
      percentile95MeasuredAt: '2026-11-18T10:30:00.000Z',
      sampleCount: 1,
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
    source: 'Health Connect',
  };

  assert.deepEqual(buildSmartwatchReadings(snapshot), [
    { type: 'heartRate', value: 72, unit: 'bpm', measuredAt: '2026-11-18T10:30:00.000Z' },
  ]);
});
