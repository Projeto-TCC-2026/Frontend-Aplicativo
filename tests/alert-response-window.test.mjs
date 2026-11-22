import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ALERT_RESPONSE_WINDOW_MINUTES,
  formatBackendAlertDate,
  getAlertResponseRemainingSeconds,
  isAlertResponseAvailable,
} from '../src/domain/alert.ts';

test('uses a configurable 10-minute default response window', () => {
  assert.equal(ALERT_RESPONSE_WINDOW_MINUTES, 10);
});

test('allows a response only within 10 minutes of alert creation', () => {
  const createdAt = '2026-11-21T23:00:00.000Z';

  assert.equal(
    isAlertResponseAvailable('AWAITING_PATIENT', createdAt, Date.parse('2026-11-21T23:09:59.999Z')),
    true,
  );
  assert.equal(
    isAlertResponseAvailable('AWAITING_PATIENT', createdAt, Date.parse('2026-11-21T23:10:00.000Z')),
    false,
  );
  assert.equal(
    isAlertResponseAvailable('PENDING', createdAt, Date.parse('2026-11-21T23:01:00.000Z')),
    false,
  );
});

test('calculates remaining response seconds and never returns a negative value', () => {
  const createdAt = '2026-11-21T23:00:00.000Z';

  assert.equal(
    getAlertResponseRemainingSeconds(createdAt, Date.parse('2026-11-21T23:03:00.000Z')),
    420,
  );
  assert.equal(
    getAlertResponseRemainingSeconds(createdAt, Date.parse('2026-11-21T23:11:00.000Z')),
    0,
  );
});

test('parses a naive backend timestamp as Brasilia time', () => {
  const backendCreatedAt = '2026-11-21T23:55:00';
  const patientNow = Date.parse('2026-11-22T00:05:00Z');

  assert.equal(getAlertResponseRemainingSeconds(backendCreatedAt, patientNow), 0);
  assert.match(formatBackendAlertDate(backendCreatedAt), /20:55/);
});

test('keeps timestamps with an explicit timezone unchanged', () => {
  const createdAt = '2026-11-21T18:00:00-03:00';

  assert.equal(
    getAlertResponseRemainingSeconds(createdAt, Date.parse('2026-11-21T21:03:00Z')),
    420,
  );
});
