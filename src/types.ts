export interface HermesURL {
  id: string;
  name: string;
  url: string;
  password?: string;
  saveCredentials: boolean;
  createdAt?: number;
  lastConnectedAt?: number;
  notes?: string;
}

export type ViewportMode = 'mobile' | 'tablet' | 'responsive';

export type ServerStatus = 'idle' | 'checking' | 'online' | 'offline';

export interface PingResult {
  status: ServerStatus;
  latencyMs?: number;
  lastCheckedAt?: number;
  error?: string;
  statusCode?: number;
}

export type Language = 'en' | 'vi';

export type Theme = 'dark' | 'light';
