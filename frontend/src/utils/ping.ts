export interface PingOutcome {
  isOnline: boolean;
  latencyMs: number;
  error?: string;
}

export async function pingServerUrl(url: string, timeoutMs = 4500): Promise<PingOutcome> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('_h_ping', String(Date.now()));

    // Mobile React Native fetch
    await fetch(urlObj.toString(), {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(Date.now() - startTime);
    return {
      isOnline: true,
      latencyMs: Math.max(1, latencyMs),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const elapsed = Math.round(Date.now() - startTime);
    const isTimeout = err?.name === 'AbortError' || elapsed >= timeoutMs;

    return {
      isOnline: false,
      latencyMs: elapsed,
      error: isTimeout ? 'Timeout' : (err?.message || 'Unreachable'),
    };
  }
}
