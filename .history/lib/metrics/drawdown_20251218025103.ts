// lib/metrics/drawdown.ts

type Trade = {
  profit: number
  time?: number
}

export function computeDrawdownMetrics(
  history: Trade[],
  balance: number
) {
  if (!history.length) {
    return {
      ddUsd: 0,
      ddPct: 0,
    }
  }

  let peakEquity = balance
  let maxDrawdownUsd = 0

  let equity = balance

  for (const trade of history) {
    equity += trade.profit

    if (equity > peakEquity) {
      peakEquity = equity
    }

    const drawdown = peakEquity - equity
    if (drawdown > maxDrawdownUsd) {
      maxDrawdownUsd = drawdown
    }
  }

  const ddPct =
    peakEquity > 0 ? (maxDrawdownUsd / peakEquity) * 100 : 0

  return {
    ddUsd: maxDrawdownUsd,
    ddPct,
  }
}
