type SessionTokenStore = {
  getRefreshToken(): Promise<string | null>;
  clear(): Promise<void>;
};

type SessionBootstrapOptions = {
  tokenStore: SessionTokenStore;
  refresh(): Promise<boolean>;
};

export async function restoreSession({ tokenStore, refresh }: SessionBootstrapOptions): Promise<boolean> {
  const refreshToken = await tokenStore.getRefreshToken();
  if (!refreshToken) {
    await tokenStore.clear();
    return false;
  }

  const refreshed = await refresh();
  if (!refreshed) {
    await tokenStore.clear();
    return false;
  }

  return true;
}
