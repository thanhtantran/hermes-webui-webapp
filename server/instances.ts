import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import type { AppConfig } from './config';
import { decryptSecret, encryptSecret } from './crypto';
import {
  deleteInstance,
  findInstanceByUrl,
  getInstance,
  insertInstance,
  listInstances,
  markInstanceConnected,
  updateInstance,
  type InstanceRow,
} from './db';
import { createRequireAuth, requireCsrf } from './auth';
import { secretLimiter, sameOriginCheck } from './security';
import { assertTargetAllowed, normalizeTargetUrl, TargetValidationError } from './target';

interface InstanceDto {
  id: string;
  name: string;
  url: string;
  notes: string | null;
  hasPassword: boolean;
  createdAt: number;
  updatedAt: number;
  lastConnectedAt: number | null;
}

interface ValidatedInput {
  name: string;
  url: string;
  notes: string | null;
  password: string | undefined;
}

function toInstanceDto(row: InstanceRow): InstanceDto {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    notes: row.notes,
    hasPassword: Boolean(row.password_enc),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastConnectedAt: row.last_connected_at,
  };
}

function validationError(message: string): TargetValidationError {
  return new TargetValidationError(message);
}

async function validateInput(body: unknown, config: AppConfig): Promise<ValidatedInput> {
  const value = (body || {}) as Record<string, unknown>;

  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!name) throw validationError('Instance name is required.');
  if (name.length > 120) throw validationError('Instance name is too long (max 120 characters).');

  if (typeof value.url !== 'string') throw validationError('Instance URL is required.');
  const url = normalizeTargetUrl(value.url);
  await assertTargetAllowed(url, config);

  let notes: string | null = null;
  if (value.notes !== undefined && value.notes !== null) {
    if (typeof value.notes !== 'string') throw validationError('Notes must be a string.');
    notes = value.notes.trim().slice(0, 500) || null;
  }

  let password: string | undefined;
  if (value.password !== undefined) {
    if (typeof value.password !== 'string') throw validationError('Password must be a string.');
    if (value.password.length > 2048) throw validationError('Password is too long.');
    password = value.password;
  }

  return { name, url, notes, password };
}

function passwordAad(instanceId: string): string {
  return `hermes-instance:${instanceId}`;
}

async function pingTarget(url: string): Promise<{
  isOnline: boolean;
  statusCode?: number;
  latencyMs: number;
  error?: string;
}> {
  const start = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return {
      isOnline: true,
      statusCode: response.status,
      latencyMs: Math.max(1, Math.round(performance.now() - start)),
    };
  } catch {
    clearTimeout(timeout);

    const retryController = new AbortController();
    const retryTimeout = setTimeout(() => retryController.abort(), 3000);
    const retryStart = performance.now();
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: retryController.signal,
      });
      await response.body?.cancel();
      clearTimeout(retryTimeout);
      return {
        isOnline: true,
        statusCode: response.status,
        latencyMs: Math.max(1, Math.round(performance.now() - retryStart)),
      };
    } catch (error) {
      clearTimeout(retryTimeout);
      return {
        isOnline: false,
        latencyMs: Math.max(1, Math.round(performance.now() - start)),
        error: error instanceof Error ? error.message : 'Host unreachable',
      };
    }
  }
}

function handleAsync(
  handler: (req: Request, res: Response) => Promise<unknown>
): (req: Request, res: Response) => void {
  return (req, res) => {
    handler(req, res).catch((error) => {
      if (error instanceof TargetValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Instance API error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    });
  };
}

export function createInstancesRouter(db: DatabaseSync, config: AppConfig): Router {
  const router = Router();
  const requireAuth = createRequireAuth(db, config);

  router.use(requireAuth);

  router.get('/', (req, res) => {
    const instances = listInstances(db, req.auth!.user.id).map(toInstanceDto);
    res.json({ instances });
  });

  router.post(
    '/import',
    sameOriginCheck,
    requireCsrf,
    handleAsync(async (req, res) => {
      const userId = req.auth!.user.id;
      const payload = Array.isArray(req.body?.instances) ? req.body.instances : null;
      if (!payload) return res.status(400).json({ error: 'Body must include an instances array.' });
      if (payload.length > 100) return res.status(400).json({ error: 'Import is limited to 100 instances.' });

      const validated: ValidatedInput[] = [];
      for (const entry of payload) {
        validated.push(await validateInput(entry, config));
      }

      let imported = 0;
      let skipped = 0;
      for (const entry of validated) {
        if (findInstanceByUrl(db, userId, entry.url)) {
          skipped += 1;
          continue;
        }

        const id = randomUUID();
        const passwordEnc = entry.password
          ? encryptSecret(entry.password, config.encryptionKey, passwordAad(id))
          : null;
        insertInstance(db, {
          id,
          userId,
          name: entry.name,
          url: entry.url,
          notes: entry.notes,
          passwordEnc,
        });
        imported += 1;
      }

      return res.json({
        instances: listInstances(db, userId).map(toInstanceDto),
        imported,
        skipped,
      });
    })
  );

  router.post(
    '/',
    sameOriginCheck,
    requireCsrf,
    handleAsync(async (req, res) => {
      const userId = req.auth!.user.id;
      const input = await validateInput(req.body, config);

      if (findInstanceByUrl(db, userId, input.url)) {
        return res.status(409).json({ error: 'An instance with this URL already exists.' });
      }

      const id = randomUUID();
      const passwordEnc = input.password
        ? encryptSecret(input.password, config.encryptionKey, passwordAad(id))
        : null;
      const created = insertInstance(db, {
        id,
        userId,
        name: input.name,
        url: input.url,
        notes: input.notes,
        passwordEnc,
      });

      return res.status(201).json({ instance: toInstanceDto(created) });
    })
  );

  router.put(
    '/:id',
    sameOriginCheck,
    requireCsrf,
    handleAsync(async (req, res) => {
      const userId = req.auth!.user.id;
      const existing = getInstance(db, userId, String(req.params.id));
      if (!existing) return res.status(404).json({ error: 'Instance not found.' });

      const input = await validateInput(req.body, config);
      const duplicate = findInstanceByUrl(db, userId, input.url);
      if (duplicate && duplicate.id !== existing.id) {
        return res.status(409).json({ error: 'Another instance already uses this URL.' });
      }

      let passwordEnc: string | null | undefined;
      if (input.password === undefined) {
        passwordEnc = undefined;
      } else if (input.password === '') {
        passwordEnc = null;
      } else {
        passwordEnc = encryptSecret(input.password, config.encryptionKey, passwordAad(existing.id));
      }

      const updated = updateInstance(db, {
        userId,
        id: existing.id,
        name: input.name,
        url: input.url,
        notes: input.notes,
        passwordEnc,
      });

      if (!updated) return res.status(404).json({ error: 'Instance not found.' });
      return res.json({ instance: toInstanceDto(updated) });
    })
  );

  router.delete('/:id', sameOriginCheck, requireCsrf, (req, res) => {
    const removed = deleteInstance(db, req.auth!.user.id, String(req.params.id));
    if (!removed) return res.status(404).json({ error: 'Instance not found.' });
    return res.json({ ok: true });
  });

  router.post('/:id/connect', sameOriginCheck, requireCsrf, (req, res) => {
    const userId = req.auth!.user.id;
    const existing = getInstance(db, userId, String(req.params.id));
    if (!existing) return res.status(404).json({ error: 'Instance not found.' });
    markInstanceConnected(db, userId, existing.id);
    const updated = getInstance(db, userId, existing.id)!;
    return res.json({ instance: toInstanceDto(updated) });
  });

  router.get('/:id/ping', handleAsync(async (req, res) => {
    const instance = getInstance(db, req.auth!.user.id, String(req.params.id));
    if (!instance) return res.status(404).json({ error: 'Instance not found.' });

    try {
      await assertTargetAllowed(instance.url, config);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Target is not allowed.';
      return res.status(400).json({ isOnline: false, latencyMs: 0, error: message });
    }

    const result = await pingTarget(instance.url);
    return res.json(result);
  }));

  router.post('/:id/password', secretLimiter, sameOriginCheck, requireCsrf, (req, res) => {
    const instance = getInstance(db, req.auth!.user.id, String(req.params.id));
    if (!instance) return res.status(404).json({ error: 'Instance not found.' });
    if (!instance.password_enc) return res.status(404).json({ error: 'No password is stored for this instance.' });

    try {
      const password = decryptSecret(
        instance.password_enc,
        config.encryptionKey,
        passwordAad(instance.id)
      );
      res.setHeader('Cache-Control', 'no-store');
      return res.json({ password });
    } catch {
      console.error(`Failed to decrypt password for instance ${instance.id}.`);
      return res.status(500).json({ error: 'Stored password could not be decrypted.' });
    }
  });

  return router;
}
