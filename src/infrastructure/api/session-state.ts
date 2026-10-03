export type SessionStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'error';

let sessionStatus: SessionStatus = 'checking';
const listeners = new Set<(status: SessionStatus) => void>();

export function getSessionStatus(): SessionStatus {
  return sessionStatus;
}

export function setSessionStatus(status: SessionStatus): void {
  sessionStatus = status;
  listeners.forEach(listener => listener(status));
}

export function subscribeToSessionStatus(listener: (status: SessionStatus) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
