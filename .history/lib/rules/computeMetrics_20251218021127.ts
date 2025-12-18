export type AccountMetrics = {
  equity: number
  balance: number
  startBalance: number
  ddTodayPct: number
  ddTotalPct: number
}

export function computeMetrics(params: {
  equity: number
  balance: number
  startBalance: number
  dayHighEquity: number
}) {
  const { equity, balance, startBalance, dayHighEquity } = params

  const ddTodayPct =
    ((dayHighEquity - equity) / dayHighEquity) * 100

  const ddTotalPct =
    ((startBalance - equity) / startBalance) * 100

  return {
    equity,
    balance,
    startBalance,
    ddTodayPct: Math.max(0, ddTodayPct),
    ddTotalPct: Math.max(0, ddTotalPct),
  }
}
