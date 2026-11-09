import { pingInstance, toPingResult } from './api';
import type { PingResult } from '../types';

export interface PingOutcome {
  isOnline: boolean;
  latencyMs: number;
  error?: string;
  statusCode?: number;
}

export async function pingServerUrl(instanceId: string): Promise<PingOutcome> {
  const result = await pingInstance(instanceId);
  return {
    isOnline: result.isOnline,
    latencyMs: result.latencyMs,
    statusCode: result.statusCode,
    error: result.error,
  };
}

export function pingOutcomeToResult(outcome: PingOutcome): PingResult {
  return toPingResult(outcome);
}
