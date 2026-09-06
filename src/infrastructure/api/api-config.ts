import { ApiClient } from './api-client';
import { secureTokenStore } from './secure-token-store';
import type { TokenStore } from './token-store';

export function createApiClient(tokenStore: TokenStore = secureTokenStore): ApiClient {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não está configurada.');
  }

  return new ApiClient({ baseUrl, tokenStore });
}
