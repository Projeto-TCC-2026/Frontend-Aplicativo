export type HealthSample = {
  value: number;
  time: string;
};

export type HealthMetricSummary = {
  percentile5: number | null;
  percentile95: number | null;
  percentile5MeasuredAt: string | null;
  percentile95MeasuredAt: string | null;
  sampleCount: number;
};

export type HealthSnapshot = {
  heartRate: HealthMetricSummary;
  oxygenSaturation: HealthMetricSummary;
  bodyTemperature: HealthMetricSummary;
  windowStart: string | null;
  windowEnd: string | null;
  source: 'Health Connect';
};

export function summarizeHealthSamples(
  samples: HealthSample[],
  windowStart: string,
  windowEnd: string,
): HealthMetricSummary {
  const start = Date.parse(windowStart);
  const end = Date.parse(windowEnd);
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
    throw new Error('O intervalo de leitura do Health Connect é inválido.');
  }

  const samplesByTime = new Map<number, number>();
  for (const sample of samples) {
    const time = Date.parse(sample.time);
    // O Backend usa o horário como parte da chave de idempotência da métrica.
    if (
      Number.isFinite(sample.value) &&
      Number.isFinite(time) &&
      time >= start &&
      time <= end &&
      !samplesByTime.has(time)
    ) {
      samplesByTime.set(time, sample.value);
    }
  }

  const validSamples = Array.from(samplesByTime, ([time, value]) => ({ value, time }))
    .sort((left, right) => left.value - right.value || left.time - right.time);

  if (validSamples.length === 0) {
    return {
      percentile5: null,
      percentile95: null,
      percentile5MeasuredAt: null,
      percentile95MeasuredAt: null,
      sampleCount: 0,
    };
  }

  const nearestRank = (percentile: number) =>
    validSamples[Math.ceil((percentile / 100) * validSamples.length) - 1];
  const percentile5 = nearestRank(5);
  const percentile95 = nearestRank(95);

  return {
    percentile5: percentile5.value,
    percentile95: percentile95.value,
    percentile5MeasuredAt: new Date(percentile5.time).toISOString(),
    percentile95MeasuredAt: new Date(percentile95.time).toISOString(),
    sampleCount: validSamples.length,
  };
}
