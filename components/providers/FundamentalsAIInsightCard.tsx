"use client"

import { useEffect, useMemo, useState } from "react"
import { Brain } from "lucide-react"
import { motion } from "framer-motion"
import md5 from "md5"

type FundamentalsAIResponse = {
  simpleSummary: string
  whyItMatters?: {
    headline?: string
    bullets?: string[]
  }
  howToTrade?: string[]
  marketImpact?: {
    equities?: string
    fx?: string
    rates?: string
    metals?: string
    crypto?: string
  }
  riskLevel?: "Low" | "Medium" | "High"
  confidence?: number
}

type CacheEntry = {
  hash: string
  data: FundamentalsAIResponse
  ts: number
}

export default function FundamentalsAIInsightCard({
  endpoint,
  payload,
  cacheKey,
  title = "Edge AI Insight",
  disabled,
}: {
  endpoint: string
  payload: any
  cacheKey: string
  title?: string
  disabled?: boolean
}) {
  const payloadHash = useMemo(
    () => md5(JSON.stringify(payload)),
    [payload]
  )

  const [data, setData] = useState<FundamentalsAIResponse | null>(null)
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

  /* ---------------- Generate ---------------- */
  async function generate(force = false) {
    if (disabled || loading) return
    if (!force && data) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "AI failed")

      const insight: FundamentalsAIResponse = json.insight ?? json

      setData(insight)

      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          hash: payloadHash,
          data: insight,
          ts: Date.now(),
        })
      )
    } catch (e: any) {
      setError(e?.message ?? "AI failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl bg-emerald-500/10 p-4 shadow-[0_0_0_1px_rgba(16,185,129,0.18)_inset]">

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
            bg-emerald-500/15
            border border-emerald-400/30
            text-emerald-200
          "
          animate={{
            scale: loading ? [1, 1.15, 1] : [1, 1.05, 1],
            boxShadow: loading
              ? [
                  "0 0 0 rgba(16,185,129,0)",
                  "0 0 18px rgba(16,185,129,0.6)",
                  "0 0 0 rgba(16,185,129,0)",
                ]
              : [
                  "0 0 0 rgba(16,185,129,0)",
                  "0 0 10px rgba(16,185,129,0.35)",
                  "0 0 0 rgba(16,185,129,0)",
                ],
          }}
          transition={{
            duration: loading ? 0.9 : 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Brain size={18} />
        </motion.button>

        <div className="text-sm font-semibold text-emerald-200">
          {title}
        </div>

        {data && (
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-200">
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
          Analyzing fundamentals…
        </div>
      )}

      {error && (
        <div className="mt-3 text-sm text-neutral-300">
          AI insight unavailable.
          <div className="mt-1 text-xs text-neutral-500">{error}</div>
        </div>
      )}

      {data && !loading && (
        <div className="mt-3 space-y-4">

          {/* SUMMARY */}
          <div>
            <div className="text-sm font-semibold text-white">
              Market summary
            </div>
            <div className="mt-1 text-sm text-neutral-200 leading-relaxed">
              {data.simpleSummary}
            </div>
          </div>

          {/* WHY IT MATTERS */}
          {data.whyItMatters?.bullets?.length ? (
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-400">
                Why it matters
              </div>
              <ul className="mt-1 space-y-1 text-sm text-neutral-200">
                {data.whyItMatters.bullets.slice(0, 4).map((x, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-200/70">•</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* HOW TO TRADE */}
          {data.howToTrade?.length ? (
            <div className="rounded-2xl bg-black/30 p-3 border border-emerald-500/20">
              <div className="text-xs uppercase tracking-wide text-emerald-200">
                How to trade
              </div>
              <ul className="mt-1 space-y-1 text-sm text-neutral-100">
                {data.howToTrade.slice(0, 3).map((x, i) => (
                  <li key={i}>• {x}</li>
                ))}
              </ul>
            </div>
          ) : null}

        </div>
      )}
    </div>
  )
}
