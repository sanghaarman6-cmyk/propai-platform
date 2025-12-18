import type { AccountMetrics, RuleTemplate } from "../accountHubStore"

function startOfDayUTC() {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export function computeMetrics(opts: {
  account: any
  template: RuleTemplate
  history: any[]
  prev?: AccountMetrics
}): AccountMetrics {
  const { account, template, history, prev } = opts

  const balance = Number(account.balance ?? 0)
  const equity = Number(account.equity ?? 0)
  const startingBalance = prev?.startingBalance ?? balance

  // Daily PnL from deals since UTC day start (rough but works)
  const dayStart = startOfDayUTC().getTime()
  const todayDeals = (history ?? []).filter((d) => {
    const t = Number(d.time) * 1000 // MT5 deal time is epoch seconds
    return t >= dayStart
  })

  const dailyPnL = todayDeals.reduce((sum, d) => sum + Number(d.profit ?? 0), 0)

  const dailyLossLimit = startingBalance * (template.dailyLossPct / 100)
  const maxLossLimit = startingBalance * (template.maxLossPct / 100)

  const dailyLossRemaining = Math.max(0, dailyLossLimit + Math.min(0, dailyPnL)) // if pnl is negative it consumes limit
  const totalLoss = Math.max(0, startingBalance - equity)
  const maxLossRemaining = Math.max(0, maxLossLimit - totalLoss)

  const ddTodayPct = dailyLossLimit > 0 ? (Math.max(0, -dailyPnL) / dailyLossLimit) * 100 : 0
  const ddTotalPct = maxLossLimit > 0 ? (totalLoss / maxLossLimit) * 100 : 0

  // Progress toward target (simple: target based on starting balance)
  const targetUsd = startingBalance * (template.profitTargetPct / 100)
  const profitSoFar = Math.max(0, equity - startingBalance)
  const profitTargetRemaining = Math.max(0, targetUsd - profitSoFar)

  // Phase heuristic (until we add explicit user mapping)
  const phase = prev?.phase ?? "Phase 1"

  // Status
  let status: AccountMetrics["status"] = "ok"
  if (dailyLossRemaining <= 0 || maxLossRemaining <= 0) status = "breached"
  else if (ddTodayPct >= 70 || ddTotalPct >= 70) status = "at_risk"

  return {
    lastSyncAt: new Date().toISOString(),
    startingBalance,
    balance,
    equity,
    currency: account.currency,
    dailyPnL,
    dailyLossRemaining,
    maxLossRemaining,
    ddTodayPct,
    ddTotalPct,
    profitTargetRemaining,
    phase,
    status,
  }
}
