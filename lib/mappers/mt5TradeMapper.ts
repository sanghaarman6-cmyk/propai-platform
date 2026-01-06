import type { Trade, TradeDirection, TradeOutcome } from "@/lib/types"
import { buildTrade } from "./buildTrade"

export function mapMT5Trade(t: any): Trade {
  const direction: TradeDirection =
    t.type === 0 ? "Long" : "Short"

  const outcome: TradeOutcome =
    t.profit > 0 ? "Win" : t.profit < 0 ? "Loss" : "BE"

  const rMultiple =
    t.sl && t.sl !== 0
      ? Math.abs(t.profit / (t.price_open - t.sl))
      : null

  const session =
    (() => {
      const hour = new Date(t.time * 1000).getUTCHours()
      if (hour >= 0 && hour < 7) return "Asia"
      if (hour >= 7 && hour < 13) return "London"
      if (hour >= 13 && hour < 20) return "New York"
      return "Off-hours"
    })()

  return buildTrade({
    id: String(t.ticket),
    tsISO: new Date(t.time * 1000).toISOString(),
    instrument: t.symbol,
    direction,
    entry: t.price_open,
    exit: t.price_close,
    profit: t.profit,
    volume: t.volume ?? 0,
    rMultiple,
    session,
  })
}
