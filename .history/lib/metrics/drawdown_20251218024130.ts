// lib/metrics/drawdown.ts

type Trade = {
  profit: number
  time: number // unix timestamp or ms
}

/**
 * Computes daily and total drawdown from trade history
 */
export function computeDrawdownMetrics(
  history: Trade[],
  startingBalance: number
) {
  let equity = startingBalance
  let peak = startingBalance

  let maxDrawdown = 0
  let todayDrawdown = 0

  const today = new Date().toDateString()

  for (const trade of history) {
    equity += trade.profit

    if (equity > peak) peak = equity

    const dd = (peak - equity) / peak
    maxDrawdown = Math.max(maxDrawdown, dd)

    const tradeDay = new Date(trade.time).toDateString()
    if (tradeDay === today && trade.profit < 0) {
      todayDrawdown += Math.abs(trade.profit)
    }
  }

  return {
    ddTotalPct: +(maxDrawdown * 100).toFixed(2),
    ddTodayUsd: +todayDrawdown.toFixed(2),
  }
}
