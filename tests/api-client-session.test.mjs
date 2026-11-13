import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiClient } from '../src/infrastructure/api/api-client.ts';
import { resolveApiBaseUrl } from '../src/infrastructure/api/api-base-url.ts';
import {
  buildAggregatedCheckinRequest,
  getCheckinErrorMessage,
  hasSelectedPhotoField,
  validateCheckinForms,
} from '../src/application/checkin-submission.ts';
import { getSessionStatus } from '../src/infrastructure/api/session-state.ts';

function createTokenStore() {
  let accessToken = 'expired-access-token';
  let refreshToken = 'valid-refresh-token';
  let cleared = false;

  return {
    getAccessToken: async () => accessToken,
    getRefreshToken: async () => refreshToken,
    saveTokens: async (tokens) => {
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    },
    clear: async () => {
      accessToken = null;
      refreshToken = null;
      cleared = true;
    },
    accessToken: () => accessToken,
    wasCleared: () => cleared,
  };
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('resolves localhost to the Expo development host for mobile devices', () => {
  assert.equal(
    resolveApiBaseUrl('http://localhost:8080/', 'android', '192.168.1.40:8081'),
    'http://192.168.1.40:8080/',
  );
});

test('uses the Android emulator host when no Expo host is available', () => {
  assert.equal(
    resolveApiBaseUrl('http://localhost:8080/', 'android'),
    'http://10.0.2.2:8080/',
  );
});

test('rejects a malformed Expo development host instead of silently using localhost', () => {
  assert.throws(
    () => resolveApiBaseUrl('http://localhost:8080/', 'android', 'expo-host:invalid-port'),
    /A URL do servidor Expo configurada para o app é inválida/,
  );
});

test('keeps localhost for web and preserves configured remote API hosts', () => {
  assert.equal(
    resolveApiBaseUrl('http://localhost:8080/', 'web'),
    'http://localhost:8080/',
  );
  assert.equal(
    resolveApiBaseUrl('https://api.example.test/', 'android', '192.168.1.40:8081'),
    'https://api.example.test/',
  );
});

test('omits empty optional fields from the aggregated check-in payload', () => {
  const forms = [{
    patientProcedureId: 'procedure-1',
    fields: [
      { id: 'temperature', dataType: 'DECIMAL' },
      { id: 'notes', dataType: 'TEXT' },
      { id: 'photo', dataType: 'PHOTO' },
    ],
  }];

  assert.deepEqual(
    buildAggregatedCheckinRequest(
      forms,
      { temperature: ' 36.5 ', notes: '   ', photo: null },
      'request-key',
    ),
    {
      patientProcedureIds: ['procedure-1'],
      idempotencyKey: 'request-key',
      fields: [{ fieldId: 'temperature', value: '36.5' }],
    },
  );
  assert.equal(hasSelectedPhotoField(forms, { photo: 'file:///local/photo.jpg' }), true);
});

test('normalizes decimal commas and validates required numeric ranges before sending', () => {
  const forms = [{
    patientProcedureId: 'procedure-1',
    fields: [
      { id: 'temperature', dataType: 'DECIMAL', required: true, minValue: 35, maxValue: 42 },
      { id: 'pain', dataType: 'INTEGER', required: false, minValue: 0, maxValue: 10 },
    ],
  }];
  const values = { temperature: ' 36,5 ', pain: '11' };

  assert.deepEqual(validateCheckinForms(forms, values), { pain: 'O valor máximo é 10.' });
  assert.deepEqual(
    buildAggregatedCheckinRequest(forms, values, 'request-key').fields,
    [
      { fieldId: 'temperature', value: '36.5' },
      { fieldId: 'pain', value: '11' },
    ],
  );
});

test('shows a friendly message instead of the backend error details', () => {
  const error = Object.assign(new Error('constraint violation: checkin_field_value'), { status: 400 });
  assert.equal(
    getCheckinErrorMessage(error, 'submit'),
    'Confira as respostas e tente enviar novamente.',
  );
});

test('restores an expired access token before accepting the saved session', async () => {
  const tokenStore = createTokenStore();
  const requests = [];
  const client = new ApiClient({
    baseUrl: 'https://api.example.test',
    tokenStore,
    fetcher: async (url, init) => {
      requests.push({ url, init });
      return jsonResponse(200, {
        success: true,
        data: { accessToken: 'new-access-token', refreshToken: 'rotated-refresh-token' },
      });
    },
  });

  assert.equal(await client.restoreSession(), true);
  assert.equal(tokenStore.accessToken(), 'new-access-token');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://api.example.test/auth/refresh');
  assert.equal(new Headers(requests[0].init.headers).has('Authorization'), false);
  assert.equal(JSON.parse(requests[0].init.body).refreshToken, 'valid-refresh-token');
  assert.equal(getSessionStatus(), 'authenticated');
});

test('clears the session and refuses protected access when refresh is rejected', async () => {
  const tokenStore = createTokenStore();
  const client = new ApiClient({
    baseUrl: 'https://api.example.test',
    tokenStore,
    fetcher: async () => jsonResponse(401, { success: false, message: 'Refresh token expired' }),
  });

  assert.equal(await client.restoreSession(), false);
  assert.equal(tokenStore.wasCleared(), true);
  assert.equal(getSessionStatus(), 'unauthenticated');
});

test('propagates patient login failures instead of resolving as a successful login', async () => {
  const client = new ApiClient({
    baseUrl: 'https://api.example.test',
    tokenStore: createTokenStore(),
    fetcher: async () => jsonResponse(401, { success: false, message: 'Invalid credentials' }),
  });

  await assert.rejects(
    client.loginPatient('patient@example.test', 'wrong-password'),
    error => error.status === 401,
  );
});

test('retries an unauthorized request with a refreshed access token', async () => {
  const tokenStore = createTokenStore();
  const authorizationHeaders = [];
  const client = new ApiClient({
    baseUrl: 'https://api.example.test',
    tokenStore,
    fetcher: async (url, init) => {
      authorizationHeaders.push(new Headers(init.headers).get('Authorization'));
      if (url.endsWith('/auth/refresh')) {
        return jsonResponse(200, {
          success: true,
          data: { accessToken: 'new-access-token', refreshToken: 'rotated-refresh-token' },
        });
      }
      if (authorizationHeaders.length === 1) {
        return jsonResponse(401, { success: false, message: 'Access token expired' });
      }
      return jsonResponse(200, { success: true, data: [] });
    },
  });

  assert.deepEqual(await client.get('/api/mobile/alerts'), { success: true, data: [] });
  assert.deepEqual(authorizationHeaders, [
    'Bearer expired-access-token',
    null,
    'Bearer new-access-token',
  ]);
});

test('requests patient home metrics for the selected procedure and date range', async () => {
  const tokenStore = createTokenStore();
  const requests = [];
  const metrics = {
    patientProcedureId: 'patient-procedure-1',
    procedureTitle: 'Recuperação',
    startDate: '2026-11-02',
    submittedToday: true,
    dailyCheckins: [],
    numericFields: [],
  };
  const client = new ApiClient({
    baseUrl: 'https://api.example.test',
    tokenStore,
    fetcher: async (url, init) => {
      requests.push({ url, init });
      return jsonResponse(200, { success: true, data: metrics });
    },
  });

  assert.deepEqual(
    await client.getPatientHomeMetrics('patient-procedure/1', '2026-11-06', '2026-11-12'),
    metrics,
  );
  assert.equal(
    requests[0].url,
    'https://api.example.test/api/mobile/patient-procedures/patient-procedure%2F1/home-metrics?startDate=2026-11-06&endDate=2026-11-12',
  );
  assert.equal(new Headers(requests[0].init.headers).get('Authorization'), 'Bearer expired-access-token');
});

test('posts the daily check-in payload to the authenticated aggregated endpoint', async () => {
  const tokenStore = createTokenStore();
  const requests = [];
  const payload = {
    patientProcedureIds: ['procedure-1'],
    idempotencyKey: 'request-key',
    fields: [{ fieldId: 'field-1', value: '36.5' }],
  };
  const submission = {
    submissionId: 'submission-1',
    checkinIds: ['checkin-1'],
    submittedAt: '2026-11-12T10:00:00',
    editableUntil: '2026-11-12T11:00:00',
  };
  const client = new ApiClient({
    baseUrl: 'https://api.example.test',
    tokenStore,
    fetcher: async (url, init) => {
      requests.push({ url, init });
      return jsonResponse(201, { success: true, data: submission });
    },
  });

  assert.deepEqual(await client.submitAggregatedCheckin(payload), submission);
  assert.equal(requests[0].url, 'https://api.example.test/api/mobile/checkins');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(new Headers(requests[0].init.headers).get('Authorization'), 'Bearer expired-access-token');
  assert.deepEqual(JSON.parse(requests[0].init.body), payload);
});

test('blocks protected routes while an unauthorized session cannot be refreshed', async () => {
  const tokenStore = createTokenStore();
  const client = new ApiClient({
    baseUrl: 'https://api.example.test',
    tokenStore,
    fetcher: async (url) => {
      if (url.endsWith('/auth/refresh')) {
        return jsonResponse(503, { success: false, message: 'Service unavailable' });
      }
      return jsonResponse(401, { success: false, message: 'Access token expired' });
    },
  });

  await assert.rejects(client.get('/api/mobile/alerts'));
  assert.equal(getSessionStatus(), 'error');
});
