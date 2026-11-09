export interface HermesURL {
  id: string;
  name: string;
  url: string;
  notes?: string | null;
  hasPassword: boolean;
  createdAt?: number;
  updatedAt?: number;
  lastConnectedAt?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  createdAt: number;
}

export interface InstanceInput {
  name: string;
  url: string;
  password?: string;
  notes?: string | null;
}

export interface ImportInstanceInput {
  name: string;
  url: string;
  notes?: string | null;
  password?: string;
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
