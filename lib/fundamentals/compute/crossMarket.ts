// lib/fundamentals/compute/crossMarket.ts
import type { CrossMarketRow, AssetClass } from "@/lib/fundamentals/types"
import type { PricePoint } from "@/lib/fundamentals/providers/prices"

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function genSparkFromSeries(series: PricePoint[]) {
  const prices = series.map((p) => p.price)
  if (!prices.length) return Array.from({ length: 28 }, () => 50)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const span = Math.max(1e-9, max - min)
  return prices.slice(-28).map((p) => Math.round(((p - min) / span) * 90 + 5))
}

function trendScore(series: PricePoint[]) {
  // very simple slope proxy
  if (series.length < 6) return 0
  const a = series[0].price
  const b = series[series.length - 1].price
  if (a <= 0) return 0
  return (b - a) / a
}

export function computeCrossRow(symbol: string, assetClass: AssetClass, series: PricePoint[]): CrossMarketRow {
  const t = trendScore(series)
  const bias = t > 0.002 ? "Long" : t < -0.002 ? "Short" : "Neutral"
  const confidence = clamp(Math.abs(t) * 120 + 0.52, 0.5, 0.78)

  const catalysts =
    assetClass === "FX"
      ? ["Rates differentials", "Risk regime", "Central bank tone"]
      : assetClass === "Indices"
      ? ["Real yields", "Earnings breadth", "Liquidity"]
      : assetClass === "Metals"
      ? ["Real yields", "USD direction", "Geopolitics"]
      : assetClass === "Rates"
      ? ["Inflation prints", "Auctions", "Central bank guidance"]
      : assetClass === "Commodities"
      ? ["Supply shocks", "Macro demand", "Geopolitics"]
      : ["Liquidity", "Flows", "Risk appetite"]

  const correlationNotes =
    assetClass === "Indices"
      ? "Indices often soften when real yields spike; rally when rates calm."
      : assetClass === "FX"
      ? "FX reacts fastest to rates expectations; can decouple around CB headlines."
      : "Cross-asset relationships are regime-dependent; confirm with rates + USD."

  const playbook =
    bias === "Long"
      ? "Prefer pullbacks to structure; reduce size into high-impact windows; take partials faster if volatility rises."
      : bias === "Short"
      ? "Sell rallies at resistance; avoid chasing breakdowns into event risk; confirm with rates alignment."
      : "Wait for confirmation: break + retest; trade smaller in chop; respect event windows."

  // placeholder levels: later we compute from pivots / ATR
  const last = series[series.length - 1]?.price ?? 0
  const keyLevels = [
    { label: "Resistance", value: Number((last * 1.005).toFixed(3)) },
    { label: "Pivot", value: Number(last.toFixed(3)) },
    { label: "Support", value: Number((last * 0.995).toFixed(3)) },
  ]

  return {
    symbol,
    assetClass,
    bias,
    confidence,
    catalysts,
    correlationNotes,
    playbook,
    keyLevels,
    spark: genSparkFromSeries(series),
  }
}
