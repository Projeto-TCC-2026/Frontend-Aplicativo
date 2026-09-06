import * as SecureStore from 'expo-secure-store';

const LAST_CHECKIN_DATE_KEY = 'recupera-saude.last-checkin-date';

export async function getLastCheckinDate(): Promise<string | null> {
  return SecureStore.getItemAsync(LAST_CHECKIN_DATE_KEY);
}

export async function markCheckinCompleted(date = new Date()): Promise<void> {
  await SecureStore.setItemAsync(LAST_CHECKIN_DATE_KEY, toDateKey(date));
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
