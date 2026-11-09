import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { hashToken, randomToken } from './crypto';

export interface UserRow {
  id: string;
  google_sub: string;
  email: string;
  name: string | null;
  picture: string | null;
  created_at: number;
  last_login_at: number;
}

export interface SessionRow {
  id: string;
  user_id: string;
  csrf_token: string;
  created_at: number;
  expires_at: number;
}

export interface InstanceRow {
  id: string;
  user_id: string;
  name: string;
  url: string;
  notes: string | null;
  password_enc: string | null;
  created_at: number;
  updated_at: number;
  last_connected_at: number | null;
}

export interface AuthenticatedSession {
  session: SessionRow;
  user: UserRow;
}

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS instances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  notes TEXT,
  password_enc TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_connected_at INTEGER,
  UNIQUE(user_id, url)
);

CREATE INDEX IF NOT EXISTS idx_instances_user ON instances(user_id);
`;

export function openDatabase(dataDir: string): DatabaseSync {
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'hermes.db'));
  db.exec(SCHEMA);
  return db;
}

export function upsertUser(
  db: DatabaseSync,
  profile: { googleSub: string; email: string; name?: string | null; picture?: string | null }
): UserRow {
  const now = Date.now();
  const existing = db
    .prepare('SELECT * FROM users WHERE google_sub = ?')
    .get(profile.googleSub) as unknown as UserRow | undefined;

  if (existing) {
    db.prepare(
      'UPDATE users SET email = ?, name = ?, picture = ?, last_login_at = ? WHERE id = ?'
    ).run(profile.email, profile.name ?? null, profile.picture ?? null, now, existing.id);
    return { ...existing, email: profile.email, name: profile.name ?? null, picture: profile.picture ?? null, last_login_at: now };
  }

  const id = randomUUID();
  db.prepare(
    'INSERT INTO users (id, google_sub, email, name, picture, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, profile.googleSub, profile.email, profile.name ?? null, profile.picture ?? null, now, now);

  return {
    id,
    google_sub: profile.googleSub,
    email: profile.email,
    name: profile.name ?? null,
    picture: profile.picture ?? null,
    created_at: now,
    last_login_at: now,
  };
}

export function getUserById(db: DatabaseSync, id: string): UserRow | null {
  return (db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow) ?? null;
}

export function createSession(
  db: DatabaseSync,
  userId: string,
  ttlMs: number
): { token: string; csrfToken: string; expiresAt: number } {
  const token = randomToken();
  const csrfToken = randomToken(24);
  const now = Date.now();
  const expiresAt = now + ttlMs;

  db.prepare(
    'INSERT INTO sessions (id, user_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(hashToken(token), userId, csrfToken, now, expiresAt);

  return { token, csrfToken, expiresAt };
}

export function findSession(db: DatabaseSync, token: string): AuthenticatedSession | null {
  const tokenHash = hashToken(token);
  const row = db
    .prepare(
      `SELECT s.id AS session_id, s.user_id AS session_user_id, s.csrf_token, s.created_at AS session_created_at,
              s.expires_at, u.*
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .get(tokenHash) as unknown as
    | {
        session_id: string;
        session_user_id: string;
        csrf_token: string;
        session_created_at: number;
        expires_at: number;
      } & UserRow
    | undefined;

  if (!row) return null;
  if (row.expires_at <= Date.now()) {
    deleteSessionByHash(db, tokenHash);
    return null;
  }

  return {
    session: {
      id: row.session_id,
      user_id: row.session_user_id,
      csrf_token: row.csrf_token,
      created_at: row.session_created_at,
      expires_at: row.expires_at,
    },
    user: {
      id: row.id,
      google_sub: row.google_sub,
      email: row.email,
      name: row.name,
      picture: row.picture,
      created_at: row.created_at,
      last_login_at: row.last_login_at,
    },
  };
}

export function deleteSessionByHash(db: DatabaseSync, tokenHash: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(tokenHash);
}

export function deleteSessionByToken(db: DatabaseSync, token: string): void {
  deleteSessionByHash(db, hashToken(token));
}

export function deleteExpiredSessions(db: DatabaseSync): void {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
}

export function listInstances(db: DatabaseSync, userId: string): InstanceRow[] {
  return db
    .prepare('SELECT * FROM instances WHERE user_id = ? ORDER BY created_at ASC')
    .all(userId) as unknown as InstanceRow[];
}

export function getInstance(db: DatabaseSync, userId: string, id: string): InstanceRow | null {
  return (
    (db
      .prepare('SELECT * FROM instances WHERE id = ? AND user_id = ?')
      .get(id, userId) as unknown as InstanceRow) ?? null
  );
}

export function findInstanceByUrl(
  db: DatabaseSync,
  userId: string,
  url: string
): InstanceRow | null {
  return (
    (db
      .prepare('SELECT * FROM instances WHERE url = ? AND user_id = ?')
      .get(url, userId) as unknown as InstanceRow) ?? null
  );
}

export function insertInstance(
  db: DatabaseSync,
  input: {
    id?: string;
    userId: string;
    name: string;
    url: string;
    notes?: string | null;
    passwordEnc?: string | null;
  }
): InstanceRow {
  const id = input.id ?? randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO instances (id, user_id, name, url, notes, password_enc, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.userId,
    input.name,
    input.url,
    input.notes ?? null,
    input.passwordEnc ?? null,
    now,
    now
  );
  return getInstance(db, input.userId, id)!;
}

export function updateInstance(
  db: DatabaseSync,
  input: {
    userId: string;
    id: string;
    name: string;
    url: string;
    notes?: string | null;
    passwordEnc?: string | null;
  }
): InstanceRow | null {
  const existing = getInstance(db, input.userId, input.id);
  if (!existing) return null;

  db.prepare(
    `UPDATE instances
     SET name = ?, url = ?, notes = ?, password_enc = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    input.name,
    input.url,
    input.notes ?? null,
    input.passwordEnc === undefined ? existing.password_enc : input.passwordEnc,
    Date.now(),
    input.id,
    input.userId
  );

  return getInstance(db, input.userId, input.id);
}

export function deleteInstance(db: DatabaseSync, userId: string, id: string): boolean {
  const result = db.prepare('DELETE FROM instances WHERE id = ? AND user_id = ?').run(id, userId);
  return Number(result.changes) > 0;
}

export function markInstanceConnected(db: DatabaseSync, userId: string, id: string): void {
  db.prepare('UPDATE instances SET last_connected_at = ? WHERE id = ? AND user_id = ?').run(
    Date.now(),
    id,
    userId
  );
}
