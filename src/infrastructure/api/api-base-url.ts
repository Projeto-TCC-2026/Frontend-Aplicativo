export function resolveApiBaseUrl(
  baseUrl: string,
  platform: string,
  hostUri?: string | null,
): string {
  const apiUrl = new URL(baseUrl);
  if (!isLoopback(apiUrl.hostname) || (platform !== 'android' && platform !== 'ios')) {
    return baseUrl;
  }

  const developmentHost = getHostName(hostUri);
  if (developmentHost && !isLoopback(developmentHost)) {
    apiUrl.hostname = developmentHost;
  } else if (platform === 'android') {
    apiUrl.hostname = '10.0.2.2';
  }

  return apiUrl.toString();
}

function getHostName(hostUri?: string | null): string | null {
  if (!hostUri) return null;

  try {
    const url = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`);
    return url.hostname;
  } catch {
    throw new Error('A URL do servidor Expo configurada para o app é inválida.');
  }
}

function isLoopback(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname.toLowerCase());
}
