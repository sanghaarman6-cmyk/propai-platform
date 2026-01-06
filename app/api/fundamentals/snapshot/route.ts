// app/api/fundamentals/snapshot/route.ts
import { NextResponse } from "next/server"
import type {
  FundamentalsSnapshot,
  MarketEvent,
  CalendarEvent,
  UICalendarEvent,
} from "@/lib/fundamentals/types"


import { withTTL } from "@/lib/fundamentals/cache"
import { ffCalendar } from "@/lib/fundamentals/providers/forexfactory"
import { fetchAllCentralBanks } from "@/lib/fundamentals/providers/rss"
import { series } from "@/lib/fundamentals/providers/prices"
import { buildAnomalies } from "@/lib/fundamentals/compute/anomalies"
import { computeCrossRow } from "@/lib/fundamentals/compute/crossMarket"
import { macroFromSignals } from "@/lib/fundamentals/compute/macro"

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function enrichCalendar(c: CalendarEvent[]): UICalendarEvent[] {

  return c.map((e) => {
    let region = "Global"
    let watch: string[] = []

    switch (e.country) {
      case "USD":
        region = "US"
        watch = ["EURUSD", "DXY", "US10Y", "NAS100", "XAUUSD"]
        break
      case "EUR":
        region = "EU"
        watch = ["EURUSD", "EURGBP", "EU rates"]
        break
      case "GBP":
        region = "UK"
        watch = ["GBPUSD", "UK rates"]
        break
      case "JPY":
        region = "JP"
        watch = ["USDJPY", "JP rates"]
        break
      case "AUD":
        region = "AU"
        watch = ["AUDUSD", "Commodities"]
        break
    }

    return {
      ...e,
      region,
      type: "Economic",
      watch,
      notes: "",
    }
  })
}


function mapCBToEvents(comms: any[]): MarketEvent[] {
  return comms.slice(0, 14).map((c: any, idx: number) => {
    const impact = Math.abs(c.hawkDove ?? 0) >= 28 ? "High" : "Medium"
    const sentiment =
      c.hawkDove >= 20 ? "Bearish" : c.hawkDove <= -20 ? "Bullish" : "Neutral"

    return {
      id: `evt-cb-${c.id}-${idx}`,
      ts: c.ts,
      title: `${c.bank}: ${c.title}`,
      summary: c.summary,
      source: "CentralBank",
      impact,
      assets: c.watchlistImpacts ?? [],
      tags: ["central-bank"],
      sentiment,
      confidence: impact === "High" ? 0.7 : 0.6,
      whyItMatters:
        "Central bank tone drives rate expectations which propagate into FX, equities and commodities.",
      expected:
        "If pricing shifts, expect follow-through first in rates, then FX, then risk assets.",
      reactionPlan:
        "Wait for confirmation (rates + FX alignment). Avoid chasing first move.",
      links: [],
    }
  })
}
import type { MarketState, VolatilityRegime } from "@/lib/fundamentals/types"

function pctChange(prices: number[]) {
  if (prices.length < 2) return 0
  const a = prices[0]
  const b = prices[prices.length - 1]
  if (!a) return 0
  return ((b - a) / a) * 100
}

function lastMovePct(prices: number[]) {
  if (prices.length < 2) return 0
  const prev = prices[prices.length - 2]
  const last = prices[prices.length - 1]
  if (!prev) return 0
  return ((last - prev) / prev) * 100
}

function clamp01to100(n: number) {
  return Math.max(0, Math.min(100, n))
}

// Map a -x..+x range into 0..100
function toScore(value: number, maxAbs: number) {
  const v = Math.max(-maxAbs, Math.min(maxAbs, value))
  const norm = (v + maxAbs) / (2 * maxAbs) // 0..1
  return clamp01to100(Math.round(norm * 100))
}

function computeVolatilityRegimeFromAnoms(anoms: any[]) {
  if (!anoms?.length) {
    return { regime: "Low" as VolatilityRegime, score: 15 }
  }
  const top = anoms
    .filter((a) => a.category === "Volatility" || a.category === "Liquidity")
    .slice(0, 6)

  if (!top.length) return { regime: "Low" as VolatilityRegime, score: 20 }

  const avgSev = Math.round(top.reduce((acc, a) => acc + (a.severity ?? 0), 0) / top.length)
  const score = clamp01to100(avgSev)

  const regime: VolatilityRegime =
    score >= 80 ? "High" : score >= 60 ? "Elevated" : score >= 35 ? "Normal" : "Low"

  return { regime, score }
}

function computeMarketState(args: {
  priceSeries: { symbol: string; s: { price: number }[] }[]
  anomalies: any[]
  calendar: { ts: number; impact: string }[]
  macroRegime?: string
}): MarketState {
  const { priceSeries, anomalies, calendar, macroRegime } = args

  const getPrices = (sym: string) => {
    const row = priceSeries.find((x) => x.symbol === sym)
    return row?.s?.map((d) => d.price).filter((n) => typeof n === "number") ?? []
  }

  // Use what you already fetch
  const eq = getPrices("NAS100").length ? getPrices("NAS100") : getPrices("SPX500")
  const gold = getPrices("XAUUSD")
  const btc = getPrices("BTCUSD")
  const oil = getPrices("WTI")

  // ✅ Risk appetite proxy
  // - Equities up = risk-on
  // - BTC up = risk-on
  // - Volatility regime down = risk-on
  const eqChg = pctChange(eq)
  const btcChg = pctChange(btc)
  const vol = computeVolatilityRegimeFromAnoms(anomalies)

  const riskRaw =
    (eqChg * 18) + (btcChg * 12) + (macroRegime === "Risk-On" ? 10 : macroRegime === "Risk-Off" ? -10 : 0) - (vol.score * 0.35)
  const riskAppetite = clamp01to100(Math.round(50 + riskRaw))

  // ✅ Rates pressure proxy (simple)
  // We don’t have yields reliably, so we proxy it:
  // - If equities down & gold down & volatility up -> “pressure”
  // - If oil spikes + vol up -> “pressure”
  const goldChg = pctChange(gold)
  const oilMove = lastMovePct(oil)

  const ratesRaw =
    (-eqChg * 16) + (-goldChg * 10) + (vol.score * 0.55) + (Math.abs(oilMove) * 60)
  const ratesPressure = clamp01to100(Math.round(35 + ratesRaw))

  // ✅ Positioning stress (proxy)
  // “Are we stretched?” = strong move + low vol OR choppy + high vol
  const eqAbs = Math.abs(eqChg)
  const btcAbs = Math.abs(btcChg)
  const stretchRaw = (eqAbs * 26) + (btcAbs * 18) + (vol.score * 0.35)
  const positioningStress = clamp01to100(Math.round(stretchRaw))

  // ✅ Event risk next 24h -> contributes to headline/bullets
  const now = Date.now()
  const next24h = calendar.filter((c) => c.ts >= now && c.ts <= now + 24 * 60 * 60 * 1000)
  const hi = next24h.some((c) => c.impact === "High" || c.impact === "Extreme")

  const headline =
    riskAppetite >= 60
      ? "Risk appetite supported"
      : riskAppetite <= 40
      ? "Risk appetite fragile"
      : "Mixed risk appetite"

  const bullets: string[] = []
  bullets.push(`Volatility: ${vol.regime} (${vol.score}/100)`)
  bullets.push(hi ? "High-impact event within 24h" : "No major event risk in next 24h")
  bullets.push(
    positioningStress >= 70 ? "Positioning looks stretched" : positioningStress >= 45 ? "Positioning normal" : "Positioning relaxed"
  )

  return {
    updatedAt: Date.now(),
    riskAppetite,
    ratesPressure,
    positioningStress,
    volatility: vol,
    headline,
    bullets,
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const symbols = (url.searchParams.get("symbols") ||
        "EURUSD,USDJPY,EURGBP,XAUUSD,BTCUSD,GBPUSD")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

        // ✅ only compute series/anomalies on symbols we can actually fetch
        const SYMBOLS_FOR_PRICES = symbols.filter((s) => s !== "US10Y" && s !== "DXY")


    const snapshot = await withTTL<FundamentalsSnapshot>(
      `snapshot:${symbols.join("|")}`,
      25_000,
      async () => {
        let calendar: CalendarEvent[] = []
        try {
          calendar = await ffCalendar()
          const now = Date.now()
            const LOOKAHEAD_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

            calendar = calendar
            .filter(e => e.ts >= now - 6 * 60 * 60 * 1000) // allow slight past
            .sort((a, b) => a.ts - b.ts)
            .slice(0, 30)


        } catch (e) {
          console.error("❌ ffCalendar failed", e)
        }

        const comms = await fetchAllCentralBanks(8)
        const cbEvents = mapCBToEvents(comms)

        const priceSeries = await Promise.all(
            SYMBOLS_FOR_PRICES.map(async (symbol) => {

            try {
              const s = await series(symbol, 24, 5 * 60_000)
              return { symbol, s }
            } catch (e) {
              console.error("❌ price series failed", symbol, e)
              return { symbol, s: [] as any[] }
            }
          })
        )

        const anomalies = await buildAnomalies({ symbols: SYMBOLS_FOR_PRICES })


        const anomalyEvents: MarketEvent[] = anomalies.slice(0, 10).map((a) => ({
          id: `evt-an-${a.id}`,
          ts: a.ts,
          title: `${a.symbol}: ${a.name}`,
          summary: a.detection,
          source: "Flow",
          impact: a.severity >= 80 ? "High" : "Medium",
          assets: [a.symbol],
          tags: ["anomaly", a.category],
          sentiment: "Neutral",
          confidence: clamp(a.severity / 100, 0.55, 0.78),
          whyItMatters: a.implication,
          expected: "Volatility shift likely",
          reactionPlan: a.suggestedAction,
        }))

        const crossMarket = priceSeries
          .filter(({ s }) => s.length)
          .map(({ symbol, s }) =>
            computeCrossRow(
              symbol,
              symbol.includes("USD") ? "FX" : "Indices",
              s
            )
          )

        const macro = macroFromSignals({
          riskScore: clamp(55 + (anomalies.length ? -8 : 6), 20, 85),
          inflationScore: 52,
          growthScore: 52,
        })

        const enrichedCalendar = enrichCalendar(calendar)
        const marketState = computeMarketState({
            priceSeries,
            anomalies,
            calendar: enrichedCalendar,
            macroRegime: macro.regime,
            })


        return {
        ts: Date.now(),
        macro,
        events: [...cbEvents, ...anomalyEvents],
        calendar: enrichedCalendar,
        marketState,
        anomalies,
        centralBanks: comms,
        crossMarket,
        }
      }
    )

    return NextResponse.json(snapshot)
  } catch (err) {
    console.error("🔥 SNAPSHOT HARD CRASH", err)
    return NextResponse.json(
      { error: "Snapshot failed", detail: String(err) },
      { status: 500 }
    )
  }
}
