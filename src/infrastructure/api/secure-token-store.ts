import * as SecureStore from 'expo-secure-store';

import type { TokenStore } from './token-store';

const ACCESS_TOKEN_KEY = 'recupera-saude.access-token';
const REFRESH_TOKEN_KEY = 'recupera-saude.refresh-token';

export const secureTokenStore: TokenStore = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  saveTokens: async ({ accessToken, refreshToken }) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};
