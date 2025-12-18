import type { PropFirmRules } from "./firmTemplates"

export function evaluateAccountStatus(
  metrics: {
    ddTodayPct: number
    ddTotalPct: number
  },
  rules: PropFirmRules
) {
  if (metrics.ddTodayPct >= rules.dailyDrawdownPct)
    return "breached"

  if (metrics.ddTotalPct >= rules.maxDrawdownPct)
    return "breached"

  if (
    metrics.ddTodayPct >= rules.dailyDrawdownPct * 0.8 ||
    metrics.ddTotalPct >= rules.maxDrawdownPct * 0.8
  )
    return "at_risk"

  return "ok"
}
