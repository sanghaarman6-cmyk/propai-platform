// lib/fundamentals/cache.ts
type Entry<T> = { exp: number; v: T }

const g = globalThis as any
if (!g.__FUND_CACHE__) g.__FUND_CACHE__ = new Map<string, Entry<any>>()

const CACHE: Map<string, Entry<any>> = g.__FUND_CACHE__

export async function withTTL<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const hit = CACHE.get(key)
  if (hit && hit.exp > now) return hit.v as T
  const v = await fn()
  CACHE.set(key, { v, exp: now + ttlMs })
  return v
}
