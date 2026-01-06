import { Trade } from "@/lib/types"

export function closedPositionToTrade(
  d: {
    id: string
    symbol: string
    direction: "Long" | "Short"
    profit: number
    volume: number
    time_close: number
    price_open?: number
    price_close?: number
  },
  baselineBalance: number
): Trade {
  const profit = Number(d.profit ?? 0)
  const volume = Number(d.volume ?? 0)

  const riskPct =
    baselineBalance > 0
      ? Math.abs(profit) / baselineBalance * 100
      : null

  return {
    id: d.id,
    tsISO: new Date(d.time_close * 1000).toISOString(),

    instrument: d.symbol,
    direction: d.direction,

    entry: d.price_open ?? 0,
    exit: d.price_close ?? 0,

    profit,
    rMultiple: null,

    volume,
    riskPct,

    session: "Off-hours", // can upgrade later
    setupTag: "MT5",

    outcome:
      profit > 0
        ? "Win"
        : profit < 0
        ? "Loss"
        : "BE",
  }
}
