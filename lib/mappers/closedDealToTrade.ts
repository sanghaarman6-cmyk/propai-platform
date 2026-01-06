import { Trade, TradeOutcome } from "@/lib/types"

export function closedDealToTrade(
  d: any,
  baselineBalance: number
): Trade {
  const profit = Number(d?.profit ?? 0)
  const volume = Number(d?.volume ?? 0)

  const outcome: TradeOutcome =
    profit > 0 ? "Win" : profit < 0 ? "Loss" : "BE"

  const riskPct =
    profit < 0 && baselineBalance > 0
      ? Math.abs(profit / baselineBalance) * 100
      : null

  const ts =
    typeof d?.time === "number"
      ? d.time
      : typeof d?.time_close === "number"
      ? d.time_close
      : Math.floor(Date.now() / 1000)

  return {
    id: String(d.ticket),
    tsISO: new Date(ts * 1000).toISOString(),

    instrument: d.symbol,
    direction: d.type === 0 ? "Long" : "Short",

    entry: 0,
    exit: 0,

    volume,
    profit,
    riskPct,
    rMultiple: null,

    session: "Off-hours",
    setupTag: "MT5",
    outcome,
  }
}
