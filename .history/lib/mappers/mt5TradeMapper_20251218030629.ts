import type { Trade, TradeDirection, TradeOutcome } from "@/lib/types"

export function mapMT5Trade(t: any): Trade {
  const direction: TradeDirection =
    t.type === 0 ? "Long" : "Short"

  const outcome: TradeOutcome =
    t.profit > 0 ? "Win" : t.profit < 0 ? "Loss" : "BE"

  return {
    id: String(t.ticket),
    tsISO: new Date(t.time * 1000).toISOString(),
    instrument: t.symbol,
    direction,
    entry: t.price_open,
    exit: t.price_close,
    rMultiple:
      t.sl && t.sl !== 0
        ? Math.abs(t.profit / (t.price_open - t.sl))
        : 0,
    durationMin: Math.max(
      1,
      Math.round((t.time_close - t.time) / 60)
    ),
    session: "Unknown",
    setupTag: "MT5",
    outcome,
    profit: t.profit,
  }
}
