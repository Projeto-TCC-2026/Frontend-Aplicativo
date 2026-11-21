import type { HealthMetricSummary, HealthSnapshot } from './health-metrics';

export type SmartwatchReading = {
  type: 'heartRate' | 'spo2' | 'temperature';
  value: number;
  unit: 'bpm' | '%' | 'celsius';
  measuredAt?: string;
};

export function buildSmartwatchReadings(snapshot: HealthSnapshot): SmartwatchReading[] {
  const readings: SmartwatchReading[] = [];

  const appendMetric = (
    type: SmartwatchReading['type'],
    unit: SmartwatchReading['unit'],
    summary: HealthMetricSummary,
  ) => {
    const values = [
      { value: summary.percentile5, measuredAt: summary.percentile5MeasuredAt },
      { value: summary.percentile95, measuredAt: summary.percentile95MeasuredAt },
    ];
    const added = new Set<string>();

    for (const measurement of values) {
      if (measurement.value === null) continue;

      const key = JSON.stringify([measurement.value, measurement.measuredAt]);
      if (added.has(key)) continue;
      added.add(key);

      readings.push({
        type,
        value: measurement.value,
        unit,
        ...(measurement.measuredAt ? { measuredAt: measurement.measuredAt } : {}),
      });
    }
  };

  appendMetric('heartRate', 'bpm', snapshot.heartRate);
  appendMetric('spo2', '%', snapshot.oxygenSaturation);
  appendMetric('temperature', 'celsius', snapshot.bodyTemperature);

  return readings;
}
