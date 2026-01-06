export type Session = "Asia" | "London" | "NY" | "Off"

export type TradeMetrics = {
  realisedR: number
  durationMin: number | null
  session: Session
  isPostLoss: boolean
}

/* -----------------------------
   SESSION CLASSIFICATION
----------------------------- */
export function getSession(openTime: number): Session {
  const h = new Date(openTime).getUTCHours()
  if (h < 7) return "Asia"
  if (h < 12) return "London"
  if (h < 20) return "NY"
  return "Off"
}

/* -----------------------------
   METRICS COMPUTATION
----------------------------- */
export function computeTradeMetrics(
  trade: {
    profit: number
    riskUsd: number
    openTime: number
    closeTime: number
  },
  prevTrade?: { metrics?: TradeMetrics }
): TradeMetrics {
  const realisedR =
    trade.riskUsd > 0 ? trade.profit / trade.riskUsd : 0

  const durationMin =
    trade.openTime && trade.closeTime
        ? (trade.closeTime - trade.openTime) / 60000
        : null


  return {
    realisedR,
    durationMin,
    session: getSession(trade.openTime),
    isPostLoss: prevTrade
      ? (prevTrade.metrics?.realisedR ?? 0) < 0
      : false
  }
}
