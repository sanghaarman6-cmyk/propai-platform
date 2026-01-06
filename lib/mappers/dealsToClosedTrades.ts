import { MT5Deal } from "@/lib/types/mt5"

export type ClosedTrade = {
  id: string
  symbol: string
  direction: "Long" | "Short"
  volume: number
  profit: number
  time_open: number
  time_close: number
}

/**
 * MT5 History is DEALS, not trades.
 * This groups deals into "trades" the way a trader expects:
 * - only BUY/SELL deals
 * - entry=0 is open leg(s)
 * - entry=1 is close leg(s)
 *
 * Works for NETTING + HEDGING.
 *
 * IMPORTANT:
 * We DO NOT rely on position_id alone in netting, but we still use it
 * as the primary bucket because MT5 attaches close legs to it.
 */
export function dealsToClosedTrades(deals: MT5Deal[]): ClosedTrade[] {
  if (!Array.isArray(deals) || deals.length === 0) return []

  // keep only trade-related deals
  const tradeDeals = deals.filter(
    (d) =>
      d &&
      typeof d.symbol === "string" &&
      d.symbol.trim().length > 0 &&
      (d.type === 0 || d.type === 1) && // buy/sell only
      (d.entry === 0 || d.entry === 1) &&
      typeof d.time === "number" &&
      d.time > 0
  )

  // sort by time ascending so we can build properly
  tradeDeals.sort((a, b) => (a.time ?? 0) - (b.time ?? 0))

  /**
   * We bucket by position_id, but within that bucket,
   * we split into multiple trades by detecting:
   * - A close leg (entry=1) completes the current trade segment.
   * - A new open leg after a completed segment starts a new trade.
   */
  const byPos = new Map<number, MT5Deal[]>()
  for (const d of tradeDeals) {
    const pid = typeof d.position_id === "number" ? d.position_id : 0
    if (!byPos.has(pid)) byPos.set(pid, [])
    byPos.get(pid)!.push(d)
  }

  const results: ClosedTrade[] = []

  for (const [pid, arr] of byPos.entries()) {
    if (pid === 0) continue // ignore balance/odd stuff tied to 0, safer

    let currentOpenTime: number | null = null
    let currentSymbol: string | null = null
    let currentDirection: "Long" | "Short" | null = null
    let currentVolumeOpen = 0

    let currentProfit = 0
    let currentCloseTime: number | null = null
    let hasClose = false

    let segmentIndex = 0

    for (const d of arr) {
      // OPEN LEG
      if (d.entry === 0) {
        // If we already finished a segment and then a new entry arrives,
        // start a new trade segment.
        if (hasClose) {
          // finalize previous
          results.push({
            id: `pos:${pid}:${segmentIndex}`,
            symbol: currentSymbol ?? d.symbol,
            direction: currentDirection ?? (d.type === 0 ? "Long" : "Short"),
            volume: round2(currentVolumeOpen),
            profit: round2(currentProfit),
            time_open: currentOpenTime ?? d.time,
            time_close: currentCloseTime ?? d.time,
          })
          segmentIndex++

          // reset
          currentOpenTime = null
          currentSymbol = null
          currentDirection = null
          currentVolumeOpen = 0
          currentProfit = 0
          currentCloseTime = null
          hasClose = false
        }

        if (currentOpenTime === null) currentOpenTime = d.time
        if (!currentSymbol) currentSymbol = d.symbol
        if (!currentDirection) currentDirection = d.type === 0 ? "Long" : "Short"
        currentVolumeOpen += safeNum(d.volume)
      }

      // CLOSE LEG
      if (d.entry === 1) {
        // only count closes if we have an open context
        // (in practice MT5 gives this correctly)
        if (currentOpenTime === null) {
          // fallback: treat this close as a standalone trade
          currentOpenTime = d.time
          currentSymbol = d.symbol
          currentDirection = d.type === 0 ? "Long" : "Short"
        }

        currentProfit += safeNum(d.profit)
        currentCloseTime = d.time
        hasClose = true
      }
    }

    // If ended with a closed segment, finalize it
    if (hasClose && currentOpenTime !== null && currentCloseTime !== null) {
      results.push({
        id: `pos:${pid}:${segmentIndex}`,
        symbol: currentSymbol ?? "—",
        direction: currentDirection ?? "Long",
        volume: round2(currentVolumeOpen),
        profit: round2(currentProfit),
        time_open: currentOpenTime,
        time_close: currentCloseTime,
      })
    }
  }

  // Sort newest first for UI
  results.sort((a, b) => b.time_close - a.time_close)
  return results
}

function safeNum(v: any): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
