export type TokenStore = {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  saveTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void>;
  clear(): Promise<void>;
};

export const emptyTokenStore: TokenStore = {
  getAccessToken: async () => null,
  getRefreshToken: async () => null,
  saveTokens: async () => undefined,
  clear: async () => undefined,
};
