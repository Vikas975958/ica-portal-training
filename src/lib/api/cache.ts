const pendingRequests = new Map<string, { promise: Promise<any>; timestamp: number }>();
const DEFAULT_CACHE_TTL_MS = 30000;
const CACHE_TTL = (() => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_CACHE_TTL_MS) {
    const raw = Number(process.env.NEXT_PUBLIC_API_CACHE_TTL_MS);
    if (Number.isFinite(raw) && raw > 0) return Math.min(raw, 5 * 60 * 1000);
  }
  return DEFAULT_CACHE_TTL_MS;
})();

export function clearApiCache() {
  pendingRequests.clear();
}

export async function memoizeRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = pendingRequests.get(key);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.promise;
  }

  const promise = fetcher().catch((err) => {
    pendingRequests.delete(key);
    throw err;
  });

  pendingRequests.set(key, { promise, timestamp: now });

  // Clean up cache after TTL expires
  setTimeout(() => {
    pendingRequests.delete(key);
  }, CACHE_TTL);

  return promise;
}

