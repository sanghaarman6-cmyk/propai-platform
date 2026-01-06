import type { Trade } from "@/lib/types"

export function computeDrawdownMetrics(
  trades: Trade[],
  baselineBalance: number
) {
  if (!baselineBalance || baselineBalance <= 0) {
    return { ddPct: 0, ddUsd: 0 }
  }

  let equity = baselineBalance
  let peak = baselineBalance
  let maxDrawdownUsd = 0

  for (const t of trades) {
    equity += t.profit

    if (equity > peak) {
      peak = equity
    }

    const dd = peak - equity
    if (dd > maxDrawdownUsd) {
      maxDrawdownUsd = dd
    }
  }

  const ddUsd = maxDrawdownUsd
  const ddPct = (ddUsd / baselineBalance) * 100

  return {
    ddUsd,
    ddPct,
  }
}

/**
 * CURRENT drawdown (prop-style): peak equity (from closed trades curve) -> current equity (live).
 * This fixes the dashboard bar accuracy because it represents "where you are right now"
 * instead of "worst drawdown ever".
 */
export function computeCurrentDrawdownFromPeak(
  trades: Trade[],
  baselineBalance: number,
  currentEquity: number
) {
  if (!baselineBalance || baselineBalance <= 0) {
    return { ddPct: 0, ddUsd: 0, peakEquity: 0 }
  }

  // Build peak based on closed-trades equity curve starting at baseline
  let curveEquity = baselineBalance
  let peak = baselineBalance

  for (const t of trades) {
    curveEquity += t.profit
    if (curveEquity > peak) peak = curveEquity
  }

  // Use LIVE equity for current drawdown (includes floating PnL if your account.equity does)
  const ddUsd = Math.max(0, peak - currentEquity)
  const ddPct = (ddUsd / baselineBalance) * 100

  return {
    ddUsd,
    ddPct,
    peakEquity: peak,
  }
}
