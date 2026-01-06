export type Mode = "percent" | "dollar"
export type TradeResult = "win" | "loss" | "breakeven"

export type Trade = {
  id: number
  ts: number
  result: TradeResult
  mode: Mode
  riskInput: number
  rewardInput: number
  multiplier: number
  feesEnabled: boolean
  feeInput: number
  feePctApplied: number
  rMultiple: number
  grossReturnPct: number
  netReturnPct: number
  feeAmount: number
  pnl: number
  equityBefore: number
  equityAfter: number
}

export type BacktestConfig = {
  mode: Mode
  initial: number
  risk: number
  reward: number
  multiplier: number
  feesEnabled: boolean
  feeValue: number
  advancedOpen: boolean
}

export type BacktestSnapshotV1 = {
  version: 1
  config: BacktestConfig
  trades: Trade[]
}
