import { Trade, TradeDirection, TradeOutcome, SessionOutcome } from "@/lib/types"

type BuildTradeInput = {
  id: string
  tsISO: string

  instrument: string
  direction: TradeDirection

  entry: number
  exit: number
  profit: number

  volume: number
  baselineBalance?: number

  rMultiple?: number | null
  session?: SessionOutcome
  setupTag?: string
}

export function buildTrade(input: BuildTradeInput): Trade {
  const {
    id,
    tsISO,
    instrument,
    direction,
    entry,
    exit,
    profit,
    volume,
    baselineBalance,
    rMultiple = null,
    session = "Off-hours",
    setupTag = "MT5",
  } = input

  const riskPct =
    baselineBalance && baselineBalance > 0
      ? Math.abs(profit) / baselineBalance * 100
      : null

  const outcome: TradeOutcome =
    profit > 0 ? "Win" : profit < 0 ? "Loss" : "BE"

  return {
    id,
    tsISO,
    instrument,
    direction,
    entry,
    exit,
    profit,
    rMultiple,
    volume,
    riskPct,
    session,
    setupTag,
    outcome,
  }
}
