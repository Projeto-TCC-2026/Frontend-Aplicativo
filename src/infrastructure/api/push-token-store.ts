import * as SecureStore from 'expo-secure-store';

const PUSH_TOKEN_KEY = 'recupera-saude.push-token';

/** Último token efetivamente registrado no Backend. */
export async function getRegisteredPushToken(): Promise<string | null> {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export async function saveRegisteredPushToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

export async function clearRegisteredPushToken(): Promise<void> {
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}

/** Indica se o token mudou em relação ao último registrado, evitando reenvio. */
export async function hasPushTokenChanged(token: string): Promise<boolean> {
  return (await getRegisteredPushToken()) !== token;
}
