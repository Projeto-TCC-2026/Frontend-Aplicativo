import type { ApiResponse } from '@/src/shared/types/api';
import { emptyTokenStore, type TokenStore } from './token-store';

export type ApiClientOptions = {
  baseUrl: string;
  tokenStore?: TokenStore;
  fetcher?: typeof fetch;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokenStore: TokenStore;
  private readonly fetcher: typeof fetch;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.tokenStore = options.tokenStore ?? emptyTokenStore;
    this.fetcher = options.fetcher ?? fetch;
  }

  async get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: 'GET' });
  }

  async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...init,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...init,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async loginPatient(email: string, password: string): Promise<PatientAuthResponse> {
    const response = await this.post<ApiResponse<PatientAuthResponse>>('/auth/patient/login', { email, password });
    const tokens = unwrapResponse(response);
    await this.tokenStore.saveTokens(tokens);
    return tokens;
  }

  async refresh(): Promise<boolean> {
    const refreshToken = await this.tokenStore.getRefreshToken();
    if (!refreshToken) return false;

    if (!this.refreshPromise) {
      this.refreshPromise = this.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', { refreshToken })
        .then(unwrapResponse)
        .then(async (response) => {
          await this.tokenStore.saveTokens(response);
          return true;
        })
        .catch(() => false)
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  async logout(): Promise<void> {
    const refreshToken = await this.tokenStore.getRefreshToken();
    try {
      if (refreshToken) {
        await this.request<void>('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }, false);
      }
    } finally {
      await this.tokenStore.clear();
    }
  }

  async getCheckinForm(patientProcedureId: string): Promise<CheckinForm> {
    return this.get<ApiResponse<CheckinForm>>(
      `/api/mobile/patient-procedures/${patientProcedureId}/checkin-form`,
    ).then(unwrapResponse);
  }

  async submitAggregatedCheckin(request: AggregatedCheckinRequest): Promise<AggregatedCheckinResponse> {
    return this.post<ApiResponse<AggregatedCheckinResponse>>('/api/mobile/checkins', request)
      .then(unwrapResponse);
  }

  private async request<T>(path: string, init: RequestInit, retryOnUnauthorized = true): Promise<T> {
    const accessToken = await this.tokenStore.getAccessToken();
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

    const response = await this.fetcher(`${this.baseUrl}${path}`, { ...init, headers });
    if (response.status === 401 && retryOnUnauthorized && await this.refresh()) {
      return this.request<T>(path, init, false);
    }

    const payload = await readPayload(response);
    if (!response.ok) {
      throw new ApiClientError(
        response.status,
        getMessage(payload, response.statusText),
        getFieldErrors(payload),
      );
    }

    return payload as T;
  }
}

export type PatientAuthResponse = {
  accessToken: string;
  refreshToken: string;
  role: string;
  patientId: string;
  fullName: string;
  email: string;
};

type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

import type {
  AggregatedCheckinRequest,
  AggregatedCheckinResponse,
  CheckinForm,
} from '@/src/domain/checkin';

function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === null) {
    throw new ApiClientError(500, response.message ?? 'A API não retornou dados.');
  }
  return response.data;
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback || 'Não foi possível concluir a operação.';
}

function getFieldErrors(payload: unknown): Record<string, string> | undefined {
  if (typeof payload !== 'object' || payload === null || !('errors' in payload)) return undefined;
  const errors = (payload as { errors?: unknown }).errors;
  return typeof errors === 'object' && errors !== null ? errors as Record<string, string> : undefined;
}
