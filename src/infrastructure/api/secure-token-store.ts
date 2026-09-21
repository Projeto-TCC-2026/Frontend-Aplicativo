import * as SecureStore from 'expo-secure-store';

import type { TokenStore } from './token-store';

const ACCESS_TOKEN_KEY = 'recupera-saude.access-token';
const REFRESH_TOKEN_KEY = 'recupera-saude.refresh-token';
const FULL_NAME_KEY = 'recupera-saude.full-name';

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
      SecureStore.deleteItemAsync(FULL_NAME_KEY),
    ]);
  },
};

/**
 * Nome completo do paciente, guardado no login a partir do `PatientAuthResponse`.
 * Fica fora do `TokenStore` porque não é credencial: o contrato daquele tipo
 * trata apenas de tokens.
 */
export async function savePatientFullName(fullName: string): Promise<void> {
  await SecureStore.setItemAsync(FULL_NAME_KEY, fullName);
}

export async function getPatientFullName(): Promise<string | null> {
  return SecureStore.getItemAsync(FULL_NAME_KEY);
}
