export type AccountMetrics = {
  equity: number
  balance: number

  maxDrawdownUsd: number
  maxDrawdownPct: number

  currentDrawdownUsd: number
  currentDrawdownPct: number
}

type TradeLike = {
  profit?: number
}

/**
 * 🔥 Computes RETROACTIVE drawdown from historical closed trades
 * Uses equity curve reconstructed from trade profits
 */
export function computeMetrics(params: {
  equity: number
  balance: number
  baselineBalance: number
  trades: TradeLike[]
}) {
  const { equity, balance, baselineBalance, trades } = params

  // -----------------------------
  // BUILD EQUITY CURVE
  // -----------------------------
  let curve = baselineBalance
  let peak = baselineBalance
  let maxDdUsd = 0

  if (Array.isArray(trades)) {
    for (const t of trades) {
      curve += Number(t.profit ?? 0)

      if (curve > peak) {
        peak = curve
      }

      const dd = peak - curve
      if (dd > maxDdUsd) {
        maxDdUsd = dd
      }
    }
  }

  // -----------------------------
  // CURRENT DRAWDOWN
  // -----------------------------
  const currentPeak = Math.max(peak, baselineBalance)
  const currentDdUsd = Math.max(0, currentPeak - equity)

  return {
    equity,
    balance,

    maxDrawdownUsd: maxDdUsd,
    maxDrawdownPct:
      peak > 0 ? (maxDdUsd / peak) * 100 : 0,

    currentDrawdownUsd: currentDdUsd,
    currentDrawdownPct:
      currentPeak > 0 ? (currentDdUsd / currentPeak) * 100 : 0,
  }
}
