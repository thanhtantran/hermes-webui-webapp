import type { AuthenticatedSession } from './db';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedSession;
    }
  }
}

export {};
