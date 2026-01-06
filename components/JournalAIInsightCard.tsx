"use client"

import { useEffect, useMemo, useState } from "react"
import { Brain } from "lucide-react"
import { motion } from "framer-motion"
import md5 from "md5"

type JournalAIResponse = {
  headline: string
  summary: string
  patterns?: string[]
  risks?: string[]
  adjustment?: string
}

type CacheEntry = {
  hash: string
  data: JournalAIResponse
  ts: number
}

export default function JournalAIInsightCard({
  endpoint,
  payload,
  disabled,
  title = "AI Journal Insight",
  cacheKey
}: {
  endpoint: string
  payload: any
  disabled?: boolean
  title?: string
  cacheKey: string
}) {
  const payloadHash = useMemo(
    () => md5(JSON.stringify(payload)),
    [payload]
  )

  const [data, setData] = useState<JournalAIResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---------------- Load cached insight ---------------- */
  useEffect(() => {
    if (!cacheKey) return

    try {
      const raw = localStorage.getItem(cacheKey)
      if (!raw) return

      const parsed: CacheEntry = JSON.parse(raw)
      if (parsed.hash === payloadHash) {
        setData(parsed.data)
      }
    } catch {}
  }, [cacheKey, payloadHash])

  /* ---------------- Manual generate ---------------- */
  async function generate(force = false) {
    if (disabled || loading) return
    if (!force && data) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "AI failed")

      setData(json)

      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          hash: payloadHash,
          data: json,
          ts: Date.now()
        })
      )
    } catch (e: any) {
      setError(e?.message ?? "AI failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl bg-violet-500/10 p-4 shadow-[0_0_0_1px_rgba(167,139,250,0.18)_inset]">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => generate()}
          disabled={disabled || loading}
          className="
            h-9 w-9
            rounded-full
            flex items-center justify-center
            leading-none
            bg-violet-500/15
            border border-violet-400/30
            text-violet-200
          "
          animate={{
            scale: loading ? [1, 1.15, 1] : [1, 1.05, 1],
            boxShadow: loading
              ? [
                  "0 0 0 rgba(139,92,246,0)",
                  "0 0 18px rgba(139,92,246,0.6)",
                  "0 0 0 rgba(139,92,246,0)"
                ]
              : [
                  "0 0 0 rgba(139,92,246,0)",
                  "0 0 10px rgba(139,92,246,0.35)",
                  "0 0 0 rgba(139,92,246,0)"
                ]
          }}
          transition={{
            duration: loading ? 0.9 : 2.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Brain size={18} />
        </motion.button>

        <div className="text-sm font-semibold text-violet-200">
          {title}
        </div>

        {data && (
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/20 text-violet-200">
            Cached
          </span>
        )}
      </div>

      {/* BODY */}
      {!data && !loading && !error && (
        <div className="mt-3 text-sm text-neutral-300">
          Click the AI brain to generate insight.
        </div>
      )}

      {loading && (
        <div className="mt-3 text-sm text-neutral-300">
          Analyzing…
        </div>
      )}

      {error && (
        <div className="mt-3 text-sm text-neutral-300">
          AI insight unavailable.
          <div className="mt-1 text-xs text-neutral-500">{error}</div>
        </div>
      )}

      {data && !loading && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-sm font-semibold text-white">
              {data.headline}
            </div>
            <div className="mt-1 text-sm text-neutral-200 leading-relaxed">
              {data.summary}
            </div>
          </div>

          {data.patterns?.length && (
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-400">
                Patterns
              </div>
              <ul className="mt-1 space-y-1 text-sm text-neutral-200">
                {data.patterns.slice(0, 4).map((x, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-violet-200/70">•</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.risks?.length && (
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-400">
                Risks
              </div>
              <ul className="mt-1 space-y-1 text-sm text-neutral-200">
                {data.risks.slice(0, 4).map((x, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-violet-200/70">•</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.adjustment && (
            <div className="rounded-2xl bg-black/30 p-3 border border-violet-500/20">
              <div className="text-xs uppercase tracking-wide text-violet-200">
                One adjustment
              </div>
              <div className="mt-1 text-sm text-neutral-100 leading-relaxed">
                {data.adjustment}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
