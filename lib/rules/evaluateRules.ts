type Severity = "critical" | "warning" | "info"
type Status = "safe" | "warn" | "danger"

type Rule =
  | {
      id: string
      category: "survival" | "behavior" | "execution" | "payout"
      type: "max_drawdown_pct"
      label: string
      limit_pct: number
      mode?: "static_balance" | "trailing_equity"
      severity: Severity
    }
  | {
      id: string
      category: "survival"
      type: "daily_loss_pct"
      label: string
      limit_pct: number
      severity: Severity
    }
  | {
      id: string
      category: "behavior"
      type: "best_day_pct"
      label: string
      limit_pct: number
      severity: Severity
    }
  | {
      id: string
      category: "behavior"
      type: "min_avg_trade_duration_sec"
      label: string
      min_sec: number
      severity: Severity
    }

export type Metrics = {
  balance: number
  equity: number
  startOfDayEquity?: number
  peakEquity?: number
  bestDayProfitPct?: number
  avgTradeDurationSec?: number
}

function toStatus(severity: Severity, ratioUsed: number): Status {
  if (ratioUsed >= 1) return "danger"
  if (ratioUsed >= 0.85) return severity === "critical" ? "danger" : "warn"
  if (ratioUsed >= 0.65) return "warn"
  return "safe"
}

export function evaluateRules(args: {
  firm_key: string
  phase: string
  program: string
  version: number
  rules: Rule[]
  metrics: Metrics
}) {
  const sections: Record<string, any[]> = {
    survival: [],
    behavior: [],
    execution: [],
    payout: [],
  }

  let maxDdRemainingUsd: number | null = null
  let maxDdRemainingPct: number | null = null
  let dailyLossRemainingUsd: number | null = null
  let dailyLossRemainingPct: number | null = null

  for (const r of args.rules) {
    if (r.type === "max_drawdown_pct") {
      const base =
        r.mode === "trailing_equity"
          ? args.metrics.peakEquity ?? args.metrics.equity
          : args.metrics.balance

      const limitUsd = (r.limit_pct / 100) * base
      const peak = args.metrics.peakEquity ?? base
      const ddUsedUsd = Math.max(0, peak - args.metrics.equity)
      const usedRatio = limitUsd > 0 ? ddUsedUsd / limitUsd : 0
      const remaining = Math.max(0, limitUsd - ddUsedUsd)

      maxDdRemainingUsd = remaining
      maxDdRemainingPct = base > 0 ? (remaining / base) * 100 : null

      sections.survival.push({
        id: r.id,
        label: `${r.label} (${r.limit_pct}%)`,
        used_pct: Math.min(100, Math.round(usedRatio * 100)),
        remaining_label: `Remaining: $${remaining.toFixed(0)}`,
        status: toStatus(r.severity, usedRatio),
        severity: r.severity,
      })
    }

    if (r.type === "daily_loss_pct") {
      const base = args.metrics.startOfDayEquity ?? args.metrics.equity
      const limitUsd = (r.limit_pct / 100) * base
      const lossToday = Math.max(0, base - args.metrics.equity)
      const usedRatio = limitUsd > 0 ? lossToday / limitUsd : 0
      const remaining = Math.max(0, limitUsd - lossToday)

      dailyLossRemainingUsd = remaining
      dailyLossRemainingPct = base > 0 ? (remaining / base) * 100 : null

      sections.survival.push({
        id: r.id,
        label: `${r.label} (${r.limit_pct}%)`,
        used_pct: Math.min(100, Math.round(usedRatio * 100)),
        remaining_label: `Remaining: $${remaining.toFixed(0)}`,
        status: toStatus(r.severity, usedRatio),
        severity: r.severity,
      })
    }

    if (r.type === "best_day_pct") {
      const v = args.metrics.bestDayProfitPct ?? null
      sections.behavior.push({
        id: r.id,
        label: r.label,
        value: v != null ? `${v.toFixed(1)}%` : "—",
        status:
          v == null
            ? "safe"
            : v >= r.limit_pct
            ? "danger"
            : v >= r.limit_pct * 0.85
            ? "warn"
            : "safe",
        severity: r.severity,
      })
    }

    if (r.type === "min_avg_trade_duration_sec") {
      const v = args.metrics.avgTradeDurationSec ?? null
      sections.behavior.push({
        id: r.id,
        label: r.label,
        value: v != null ? `${Math.round(v)}s` : "—",
        status: v == null ? "safe" : v < r.min_sec ? "warn" : "safe",
        severity: r.severity,
      })
    }
  }

  const ai_insight = {
    status: "warn" as const,
    title: "Closest risk: Daily Loss",
    message:
      "This is a placeholder insight. Next we’ll generate a proper explanation from your computed numbers.",
    recommendation:
      "Reduce size when remaining buffers are tight.",
  }

  return {
    headroom: {
      max_dd_remaining_usd: maxDdRemainingUsd,
      max_dd_remaining_pct: maxDdRemainingPct,
      daily_loss_remaining_usd: dailyLossRemainingUsd,
      daily_loss_remaining_pct: dailyLossRemainingPct,
      consistency_status: "safe" as const,
    },
    sections,
    ai_insight,
  }
}
