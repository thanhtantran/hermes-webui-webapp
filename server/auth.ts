import { Router, type Request, type RequestHandler, type Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { OAuth2Client } from 'google-auth-library';
import type { AppConfig } from './config';
import { safeEqual } from './crypto';
import {
  createSession,
  deleteSessionByToken,
  findSession,
  upsertUser,
  type UserRow,
} from './db';
import { authLimiter, sameOriginCheck } from './security';

export const SESSION_COOKIE = 'hermes_session';

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  createdAt: number;
}

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    createdAt: user.created_at,
  };
}

function cookieSecure(req: Request, config: AppConfig): boolean {
  if (config.cookieSecure === 'always') return true;
  if (config.cookieSecure === 'never') return false;
  return req.secure || req.get('x-forwarded-proto') === 'https';
}

function sessionCookieOptions(req: Request, config: AppConfig) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: cookieSecure(req, config),
    path: '/',
  };
}

export function setSessionCookie(
  req: Request,
  res: Response,
  config: AppConfig,
  token: string,
  expiresAt: number
): void {
  res.cookie(SESSION_COOKIE, token, {
    ...sessionCookieOptions(req, config),
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(req: Request, res: Response, config: AppConfig): void {
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions(req, config));
}

export function createRequireAuth(db: DatabaseSync, config: AppConfig): RequestHandler {
  return (req, res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token || typeof token !== 'string') {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const auth = findSession(db, token);
    if (!auth) {
      clearSessionCookie(req, res, config);
      return res.status(401).json({ error: 'Session expired or invalid.' });
    }

    req.auth = auth;
    return next();
  };
}

export const requireCsrf: RequestHandler = (req, res, next) => {
  const provided = req.get('x-csrf-token');
  if (!provided || !req.auth || !safeEqual(provided, req.auth.session.csrf_token)) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token.' });
  }
  return next();
};

function isEmailAllowed(email: string, config: AppConfig): boolean {
  const normalized = email.toLowerCase();
  if (config.allowedEmails.size > 0 && !config.allowedEmails.has(normalized)) {
    return false;
  }
  if (config.allowedEmailDomains.size > 0) {
    const domain = normalized.split('@')[1] || '';
    if (!config.allowedEmailDomains.has(domain)) return false;
  }
  return true;
}

export function createAuthRouter(db: DatabaseSync, config: AppConfig): Router {
  const router = Router();
  const googleClient = new OAuth2Client(config.googleClientId);
  const requireAuth = createRequireAuth(db, config);

  router.get('/config', (_req, res) => {
    res.json({ googleClientId: config.googleClientId });
  });

  router.post('/google', authLimiter, sameOriginCheck, async (req, res) => {
    const credential = typeof req.body?.credential === 'string' ? req.body.credential : '';
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential.' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: 'Google sign-in verification failed.' });
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ error: 'Google account email must be verified.' });
    }
    if (!isEmailAllowed(payload.email, config)) {
      return res.status(403).json({ error: 'This Google account is not allowed on this server.' });
    }

    const user = upsertUser(db, {
      googleSub: payload.sub,
      email: payload.email,
      name: payload.name ?? null,
      picture: payload.picture ?? null,
    });

    const { token, csrfToken, expiresAt } = createSession(db, user.id, config.sessionTtlMs);
    setSessionCookie(req, res, config, token, expiresAt);

    return res.json({ user: toPublicUser(user), csrfToken });
  });

  router.get('/me', requireAuth, (req, res) => {
    return res.json({
      user: toPublicUser(req.auth!.user),
      csrfToken: req.auth!.session.csrf_token,
    });
  });

  router.post('/logout', requireAuth, sameOriginCheck, requireCsrf, (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token === 'string') deleteSessionByToken(db, token);
    clearSessionCookie(req, res, config);
    return res.json({ ok: true });
  });

  return router;
}
