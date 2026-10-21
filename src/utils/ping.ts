/**
 * Utility for performing server connectivity and latency checks.
 * Queries the backend /api/ping endpoint first, with client-side fallback.
 */

export interface PingOutcome {
  isOnline: boolean;
  latencyMs: number;
  error?: string;
  statusCode?: number;
}

export async function pingServerUrl(url: string, timeoutMs = 4500): Promise<PingOutcome> {
  const startTime = performance.now();

  // 1. Try server-side ping endpoint first (no CORS restriction, accurate status)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`/api/ping?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return {
        isOnline: Boolean(data.isOnline),
        latencyMs: data.latencyMs || Math.round(performance.now() - startTime),
        statusCode: data.statusCode,
        error: data.error,
      };
    }
  } catch (backendErr) {
    // If backend ping failed or in client-only preview, proceed to client fallback
  }

  // 2. Client-side fallback using no-cors fetch
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('_h_ping', String(Date.now()));

    await fetch(urlObj.toString(), {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      isOnline: true,
      latencyMs: Math.max(1, latencyMs),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    // If HEAD failed, try GET
    if (err?.name !== 'AbortError') {
      try {
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), 2500);
        const retryStart = performance.now();

        await fetch(url, {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
          signal: retryController.signal,
        });

        clearTimeout(retryTimeout);
        return {
          isOnline: true,
          latencyMs: Math.round(performance.now() - retryStart),
        };
      } catch {
        // Fall through to offline
      }
    }

    const elapsed = Math.round(performance.now() - startTime);
    const isTimeout = err?.name === 'AbortError' || elapsed >= timeoutMs;

    return {
      isOnline: false,
      latencyMs: elapsed,
      error: isTimeout ? 'Timeout (>4.5s)' : (err?.message || 'Host unreachable'),
    };
  }
}
