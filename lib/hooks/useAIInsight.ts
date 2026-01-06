"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import md5 from "md5"

type GenerateOptions = {
  force?: boolean
}

export function useAIInsight<T>(
  generateFn: (metrics: T) => Promise<string>,
  metrics?: T,
  storageKey?: string
) {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cachedHash, setCachedHash] = useState<string>("")

  const metricsHash = useMemo(() => {
    return metrics ? md5(JSON.stringify(metrics)) : ""
  }, [metrics])

  /* ---------------------------------------------
   * Load from localStorage on mount / metrics change
   * --------------------------------------------- */
  useEffect(() => {
    if (!storageKey || !metricsHash) return

    const raw = localStorage.getItem(storageKey)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw)

      if (parsed.hash === metricsHash && parsed.text) {
        setInsight(parsed.text)
        setCachedHash(parsed.hash)
      }
    } catch {
      // corrupted cache → ignore
    }
  }, [metricsHash, storageKey])

  /* ---------------------------------------------
   * Generate AI insight
   * --------------------------------------------- */
  const generate = useCallback(
    async (opts?: GenerateOptions) => {
      if (!metrics) return

      if (!opts?.force && metricsHash === cachedHash && insight) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await generateFn(metrics)
        setInsight(result)
        setCachedHash(metricsHash)

        if (storageKey) {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              hash: metricsHash,
              text: result,
              ts: Date.now()
            })
          )
        }
      } catch (e: any) {
        setError(e?.message ?? "AI insight failed")
      } finally {
        setLoading(false)
      }
    },
    [metrics, metricsHash, cachedHash, insight, generateFn, storageKey]
  )

  return {
    insight,
    loading,
    error,
    generate
  }
}
