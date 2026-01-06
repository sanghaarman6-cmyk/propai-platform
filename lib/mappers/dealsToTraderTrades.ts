import { MT5Deal } from "@/lib/types/mt5"
import { Trade } from "@/lib/types"
import { buildTrade } from "./buildTrade"

type OpenLot = {
  symbol: string
  direction: "Long" | "Short"
  remainingVol: number
  entryPrice: number
  entryTime: number
}

function safeISO(sec?: number) {
  if (!sec || sec <= 0) return new Date().toISOString()
  const d = new Date(sec * 1000)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function outcomeFromProfit(p: number): "Win" | "Loss" | "BE" {
  return p > 0 ? "Win" : p < 0 ? "Loss" : "BE"
}

// Very simple session classifier (UTC-based). Good enough for now.
function inferSession(tsISO: string): "Asia" | "London" | "New York" | "Off-hours" {
  const h = new Date(tsISO).getUTCHours()
  if (h >= 0 && h < 7) return "Asia"
  if (h >= 7 && h < 13) return "London"
  if (h >= 13 && h < 21) return "New York"
  return "Off-hours"
}

function inferSetupTagFromComment(c?: string) {
  const s = (c ?? "").toLowerCase()
  if (s.includes("[sl")) return "SL"
  if (s.includes("[tp")) return "TP"
  return "MT5"
}

/**
 * FIFO synthetic trades from deals.
 * - Uses deal.entry: 0 = entry, 1 = exit
 * - Splits partial exits into multiple Trade rows
 * - Allocates exit profit proportionally by matched volume
 */
export function dealsToTraderTrades(deals: MT5Deal[]): Trade[] {
  const clean = (Array.isArray(deals) ? deals : [])
    .filter((d) => d && d.symbol && d.symbol !== "" && d.volume > 0)
    .sort((a, b) => (a.time ?? 0) - (b.time ?? 0))

  const open: Record<string, OpenLot[]> = {}
  const out: Trade[] = []

  for (const d of clean) {
    const entry = Number(d.entry)

    // Only care about IN/OUT executions
    if (entry !== 0 && entry !== 1) continue

    const symbol = d.symbol
    const price = Number(d.price ?? 0)
    const vol = Number(d.volume ?? 0)
    if (!symbol || vol <= 0) continue

    // MT5: deal.type numeric. We'll infer direction by entry lots.
    // For entries: type often indicates buy/sell.
    // If your mapping ends inverted, just flip the condition once.
    const isBuy = Number(d.type) === 0
    const direction: "Long" | "Short" = isBuy ? "Long" : "Short"

    if (entry === 0) {
      open[symbol] ??= []
      open[symbol].push({
        symbol,
        direction,
        remainingVol: vol,
        entryPrice: price,
        entryTime: d.time,
      })
      continue
    }

    // entry === 1 (EXIT)
    let remainingToClose = vol
    const lots = open[symbol] ?? []

    // Exit profit in MT5 is usually the realized profit for THIS exit deal.
    // If one exit closes multiple open lots, we allocate proportionally by volume.
    while (remainingToClose > 0 && lots.length > 0) {
      const head = lots[0]
      const matched = Math.min(head.remainingVol, remainingToClose)

      const allocProfit =
        vol > 0 ? Number(d.profit ?? 0) * (matched / vol) : Number(d.profit ?? 0)

      const tsISO = safeISO(d.time)
      const session = inferSession(tsISO)

      out.push(
        buildTrade({
          id: `deal:${d.ticket}:entry:${head.entryTime}:vol:${matched}`,
          tsISO,
          instrument: symbol,
          direction: head.direction,
          entry: head.entryPrice,
          exit: price,
          profit: Number(allocProfit.toFixed(2)),
          volume: matched,
          baselineBalance: undefined, // pass if you want risk %
          session,
          setupTag: inferSetupTagFromComment(d.comment),
        })
      )

      head.remainingVol -= matched
      remainingToClose -= matched

      if (head.remainingVol <= 0) lots.shift()
    }
  }

  // newest first (like a history tab)
  return out.sort((a, b) => (b.tsISO > a.tsISO ? 1 : -1))
}
