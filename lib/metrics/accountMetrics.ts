export type TradeForMetrics = {
  closedAt: string | number | Date
  pnl: number // NET pnl (already includes commissions/swaps/fees)
  symbol?: string
}

export type AccountMetrics = {
  performance: {
    sharpe: number | null
    sortino: number | null
    mar: number | null
    calmar: number | null
    cagr: number | null
    annualized_return: number | null
  }
  statistics: {
    expectancy: number | null
    win_rate: number | null
    profit_factor: number | null
    total_trades: number
    avg_win: number | null
    avg_loss: number | null
  }
  risk: {
    max_drawdown_peak: number | null // peak-to-trough (decimal)
    max_drawdown_start: number | null // start-to-trough (decimal) ✅ prop style
    volatility: number | null
  }
  meta: {
    start_equity: number
    end_equity: number
    days_active: number | null
    pnl_sum: number
  }
}

function toMs(d: TradeForMetrics["closedAt"]) {
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime()
  return Number.isFinite(t) ? t : 0
}

function mean(xs: number[]) {
  if (!xs.length) return NaN
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function stddev(xs: number[]) {
  if (xs.length < 2) return NaN
  const m = mean(xs)
  const v = xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1)
  return Math.sqrt(v)
}

export function buildEquityCurve(startEquity: number, trades: TradeForMetrics[]) {
  const eq: number[] = [startEquity]
  for (const t of trades) eq.push(eq[eq.length - 1] + t.pnl)
  return eq
}

export function computeAccountMetrics(params: {
  trades: TradeForMetrics[]
  startEquity: number
}): AccountMetrics {
  const trades = [...params.trades]
    .filter((t) => Number.isFinite(t.pnl))
    .sort((a, b) => toMs(a.closedAt) - toMs(b.closedAt))

  const startEquity = params.startEquity
  const pnlSum = trades.reduce((a, t) => a + t.pnl, 0)

  const equity = buildEquityCurve(startEquity, trades)
  const endEquity = equity[equity.length - 1]

  // trade returns: pnl / equity_before_trade
  const returns: number[] = []
  for (let i = 0; i < trades.length; i++) {
    const eqBefore = equity[i]
    returns.push(eqBefore !== 0 ? trades[i].pnl / eqBefore : 0)
  }

  const rMean = mean(returns)
  const rStd = stddev(returns)
  const downsideStd = stddev(returns.filter((r) => r < 0))

  const sharpe = Number.isFinite(rMean) && Number.isFinite(rStd) && rStd > 0 ? rMean / rStd : null
  const sortino =
    Number.isFinite(rMean) && Number.isFinite(downsideStd) && downsideStd > 0 ? rMean / downsideStd : null

  // Peak-to-trough DD
  let peak = equity[0]
  let maxPeakDD = 0
  for (const e of equity) {
    if (e > peak) peak = e
    const dd = peak > 0 ? (peak - e) / peak : 0
    if (dd > maxPeakDD) maxPeakDD = dd
  }

  // Start-to-trough DD (prop style)
  let minEquity = equity[0]
  for (const e of equity) minEquity = Math.min(minEquity, e)
  const maxStartDD = startEquity > 0 ? (startEquity - minEquity) / startEquity : 0

  // time span
  const startMs = trades.length ? toMs(trades[0].closedAt) : null
  const endMs = trades.length ? toMs(trades[trades.length - 1].closedAt) : null
  const daysActive =
    startMs && endMs && endMs > startMs ? Math.max(1, Math.round((endMs - startMs) / 86400000)) : null
  const years = daysActive ? daysActive / 365 : null

  const totalReturn = startEquity > 0 ? (endEquity - startEquity) / startEquity : null
  const annualized_return = years && totalReturn != null ? totalReturn / years : null
  const cagr =
    years && startEquity > 0 && endEquity > 0 ? Math.pow(endEquity / startEquity, 1 / years) - 1 : null

  const mar =
    annualized_return != null && maxPeakDD > 0 ? annualized_return / maxPeakDD : null
  const calmar =
    cagr != null && maxPeakDD > 0 ? cagr / maxPeakDD : null

  // stats
  const wins = trades.filter((t) => t.pnl > 0)
  const losses = trades.filter((t) => t.pnl < 0)

  const total_trades = trades.length
  const win_rate = total_trades ? wins.length / total_trades : null

  const avg_win = wins.length ? mean(wins.map((t) => t.pnl)) : null
  const avg_loss = losses.length ? Math.abs(mean(losses.map((t) => t.pnl))) : null

  const grossProfit = wins.reduce((a, t) => a + t.pnl, 0)
  const grossLossAbs = Math.abs(losses.reduce((a, t) => a + t.pnl, 0))
  const profit_factor = grossLossAbs > 0 ? grossProfit / grossLossAbs : null

  const expectancy =
    win_rate != null && avg_win != null && avg_loss != null
      ? win_rate * avg_win - (1 - win_rate) * avg_loss
      : null

  return {
    performance: { sharpe, sortino, mar, calmar, cagr, annualized_return },
    statistics: { expectancy, win_rate, profit_factor, total_trades, avg_win, avg_loss },
    risk: {
      max_drawdown_peak: Number.isFinite(maxPeakDD) ? maxPeakDD : null,
      max_drawdown_start: Number.isFinite(maxStartDD) ? maxStartDD : null,
      volatility: Number.isFinite(rStd) ? rStd : null
    },
    meta: {
      start_equity: startEquity,
      end_equity: endEquity,
      days_active: daysActive,
      pnl_sum: pnlSum
    }
  }
}
