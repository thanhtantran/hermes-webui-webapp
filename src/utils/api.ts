import type {
  AuthUser,
  HermesURL,
  ImportInstanceInput,
  InstanceInput,
  PingResult,
} from '../types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface AuthResponse {
  user: AuthUser;
  csrfToken: string;
}

interface InstanceResponse {
  instance: HermesURL;
}

interface ImportResponse {
  instances: HermesURL[];
  imported: number;
  skipped: number;
}

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: { suppressAuthEvent?: boolean } = {}
): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);

  if (method !== 'GET' && method !== 'HEAD') {
    if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError('Network error. Check that the server is reachable.', 0);
  }

  if (response.status === 401 && !options.suppressAuthEvent) {
    csrfToken = null;
    window.dispatchEvent(new Event('hermes:session-expired'));
  }

  if (!response.ok) {
    let message = response.statusText || `Request failed (${response.status}).`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // Non-JSON error body.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return undefined as T;
  return (await response.json()) as T;
}

export function getAuthConfig(): Promise<{ googleClientId: string }> {
  return request('/api/auth/config');
}

export function getMe(suppressAuthEvent = false): Promise<AuthResponse> {
  return request('/api/auth/me', {}, { suppressAuthEvent });
}

export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
  const auth = await request<AuthResponse>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  setCsrfToken(auth.csrfToken);
  return auth;
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' });
  csrfToken = null;
}

export async function listInstances(): Promise<HermesURL[]> {
  const result = await request<{ instances: HermesURL[] }>('/api/instances');
  return result.instances;
}

export async function createInstance(input: InstanceInput): Promise<HermesURL> {
  const result = await request<InstanceResponse>('/api/instances', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.instance;
}

export async function updateInstance(id: string, input: InstanceInput): Promise<HermesURL> {
  const result = await request<InstanceResponse>(`/api/instances/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return result.instance;
}

export async function deleteInstance(id: string): Promise<void> {
  await request(`/api/instances/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function connectInstance(id: string): Promise<HermesURL> {
  const result = await request<InstanceResponse>(
    `/api/instances/${encodeURIComponent(id)}/connect`,
    { method: 'POST' }
  );
  return result.instance;
}

export async function pingInstance(id: string): Promise<{
  isOnline: boolean;
  latencyMs: number;
  statusCode?: number;
  error?: string;
}> {
  return request(`/api/instances/${encodeURIComponent(id)}/ping`);
}

export async function revealPassword(id: string): Promise<string> {
  const result = await request<{ password: string }>(
    `/api/instances/${encodeURIComponent(id)}/password`,
    { method: 'POST' }
  );
  return result.password;
}

export async function importInstances(
  instances: ImportInstanceInput[]
): Promise<ImportResponse> {
  return request('/api/instances/import', {
    method: 'POST',
    body: JSON.stringify({ instances }),
  });
}

export function toPingResult(result: {
  isOnline: boolean;
  latencyMs: number;
  statusCode?: number;
  error?: string;
}): PingResult {
  return {
    status: result.isOnline ? 'online' : 'offline',
    latencyMs: result.latencyMs,
    lastCheckedAt: Date.now(),
    statusCode: result.statusCode,
    error: result.error,
  };
}
