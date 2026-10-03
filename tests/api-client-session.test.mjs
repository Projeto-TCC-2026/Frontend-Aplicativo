import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiClient } from '../src/infrastructure/api/api-client.ts';
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
