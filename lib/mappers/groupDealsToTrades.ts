import type { Trade } from "@/lib/types"
import { buildTrade } from "./buildTrade"

export function groupDealsToTrades(deals: any[]): Trade[] {
  if (!Array.isArray(deals)) return []

  const map = new Map<string, any[]>()

  for (const d of deals) {
    const key = String(
      d.position ??
        d.position_id ??
        d.order ??
        d.order_id ??
        d.ticket
    )

    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(d)
  }

  const trades: Trade[] = []

  for (const [id, ds] of map.entries()) {
    if (!ds.length) continue

    const entry = ds.find((d) => d.entry === 0) ?? ds[0]
    const exit = ds.find((d) => d.entry === 1) ?? ds[ds.length - 1]

    const profit = ds.reduce(
      (sum: number, d: any) =>
        sum + (typeof d.profit === "number" ? d.profit : 0),
      0
    )

    const time =
      exit?.time_close ??
      exit?.time ??
      entry?.time ??
      Math.floor(Date.now() / 1000)

    trades.push(
      buildTrade({
        id,
        tsISO: new Date(time * 1000).toISOString(),
        instrument: entry.symbol,
        direction:
          entry.type === 0 || entry.type === "buy"
            ? "Long"
            : "Short",
        entry: entry.price_open ?? 0,
        exit: exit.price_close ?? entry.price_open ?? 0,
        profit,
        volume: Math.abs(entry.volume ?? 0),
      })
    )
  }

  // newest first
  return trades.sort((a, b) => (a.tsISO < b.tsISO ? 1 : -1))
}
