"use client"

import { Brain, Loader2 } from "lucide-react"
import clsx from "clsx"

export type AnalyticsAIResponse = {
  snapshot: {
    edge_quality: "strong" | "neutral" | "weak"
    regime: "stable" | "volatile" | "decaying"
    confidence: number
  }
  edge_read: string[]
  fix_rules: string[]
  next_action: string[]
}

export default function AnalyticsAIInsightCard({
  data,
  loading,
  error,
  onRun
}: {
  data: AnalyticsAIResponse | null
  loading: boolean
  error: string | null
  onRun: () => void
}) {
  const badgeTone =
    data?.snapshot.edge_quality === "strong"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
      : data?.snapshot.edge_quality === "weak"
        ? "bg-red-500/15 text-red-300 border-red-500/25"
        : "bg-yellow-500/15 text-yellow-200 border-yellow-500/25"

  const conf = data ? Math.round(data.snapshot.confidence * 100) : null

  return (
    <div className="rounded-xl bg-gradient-to-br from-[#111111] to-[#10493d53] border border-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-white">
          <Brain size={18} className="text-emerald-400" />
          <div>
            <div className="font-medium">AI Insight</div>
            <div className="text-xs text-white/40">
              Deterministic analytics explanation (no chat)
            </div>
          </div>
        </div>

        <button
          onClick={onRun}
          disabled={loading}
          className={clsx(
            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs border transition",
            "border-white/10 text-white/70 hover:text-white hover:border-white/20",
            loading && "opacity-60 cursor-not-allowed"
          )}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          {loading ? "Running…" : data ? "Re-run AI" : "Generate"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {!data && !loading ? (
        <p className="mt-3 text-sm text-white/50 leading-relaxed">
          Generate insights from your computed metrics: edge quality, drawdown drivers,
          rules to fix leaks, and your next actions.
        </p>
      ) : null}

      {data ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx("text-xs border rounded-full px-2 py-1", badgeTone)}>
              Edge: {data.snapshot.edge_quality}
            </span>
            <span className="text-xs border border-white/10 rounded-full px-2 py-1 text-white/60">
              Regime: {data.snapshot.regime}
            </span>
            <span className="text-xs border border-white/10 rounded-full px-2 py-1 text-white/60">
              Confidence: {conf}%
            </span>
          </div>

          <Section title="Edge Read" items={data.edge_read} />
          <Section title="Fix Rules" items={data.fix_rules} />
          <Section title="Next Actions" items={data.next_action} />
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 text-sm text-white/50">
          Analyzing metrics…
        </div>
      ) : null}
    </div>
  )
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs text-white/50 uppercase tracking-wide mb-2">
        {title}
      </div>
      <ul className="space-y-2">
        {(items ?? []).slice(0, 6).map((t, i) => (
          <li
            key={i}
            className="text-sm text-white/70 leading-relaxed rounded-lg border border-white/5 bg-black/20 p-2"
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}
