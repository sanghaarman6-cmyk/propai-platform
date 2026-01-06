// lib/fundamentals/providers/tradingeconomics.ts
import type { CalendarEvent, MarketEvent, Impact, SourceKind, SentimentLabel } from "@/lib/fundamentals/types"

const BASE = "https://api.tradingeconomics.com"

function teCred() {
  const key = process.env.TRADING_ECONOMICS_KEY || "guest"
  const secret = process.env.TRADING_ECONOMICS_SECRET || "guest"
  return `${key}:${secret}`
}

// Map TE importance (0..3 typically) to your impact labels
function impactFromImportance(importance?: number): Impact {
  const n = typeof importance === "number" ? importance : 1
  if (n >= 3) return "Extreme"
  if (n === 2) return "High"
  if (n === 1) return "Medium"
  return "Low"
}

// Simple region mapping from country names → your union
function regionFromCountry(country: string): CalendarEvent["region"] {
  const c = country.toLowerCase()
  if (c.includes("united states") || c === "usa") return "US"
  if (c.includes("euro") || c.includes("germany") || c.includes("france") || c.includes("italy") || c.includes("spain"))
    return "EU"
  if (c.includes("united kingdom") || c.includes("britain") || c.includes("england")) return "UK"
  if (c.includes("japan")) return "JP"
  if (c.includes("china")) return "CN"
  if (c.includes("australia")) return "AU"
  if (c.includes("canada")) return "CA"
  return "Global"
}

function safeTs(dateStr?: string) {
  if (!dateStr) return Date.now()
  const t = Date.parse(dateStr)
  return Number.isFinite(t) ? t : Date.now()
}

function classifyCalendarType(eventName: string): CalendarEvent["type"] {
  const e = eventName.toLowerCase()
  if (e.includes("auction")) return "Auction"
  if (e.includes("speech") || e.includes("testimony") || e.includes("conference")) return "Speech"
  if (e.includes("rate") || e.includes("decision") || e.includes("statement")) return "CB"
  if (e.includes("holiday")) return "Holiday"
  return "Data"
}

export async function teCalendar(params: {
  initDate?: string // yyyy-mm-dd
  endDate?: string // yyyy-mm-dd
  importance?: 0 | 1 | 2 | 3
}): Promise<CalendarEvent[]> {
  const c = encodeURIComponent(teCred())
  const q = new URLSearchParams()
  q.set("c", c)
  if (params.importance !== undefined) q.set("importance", String(params.importance))
  if (params.initDate) q.set("initDate", params.initDate)
  if (params.endDate) q.set("endDate", params.endDate)

  const url = `${BASE}/calendar?${q.toString()}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`TE calendar failed: ${res.status}`)
  const raw = (await res.json()) as any[]

  const out: CalendarEvent[] = raw.map((x) => {
    const title = String(x.Event ?? x.Category ?? "Event")
    const country = String(x.Country ?? "Global")
    const ts = safeTs(String(x.Date ?? x.DateTime ?? ""))

    const expected = x.Forecast ?? x.Consensus ?? undefined
    const prior = x.Previous ?? undefined
    const actual = x.Actual ?? undefined

    const notesParts: string[] = []
    if (actual !== undefined && actual !== null && actual !== "") notesParts.push(`Actual: ${actual}`)
    if (expected !== undefined && expected !== null && expected !== "") notesParts.push(`Forecast: ${expected}`)
    if (prior !== undefined && prior !== null && prior !== "") notesParts.push(`Previous: ${prior}`)

    return {
      id: String(x.CalendarId ?? x.CalendarID ?? `${country}-${title}-${ts}`),
      ts,
      region: regionFromCountry(country),
      title,
      type: classifyCalendarType(title),
      impact: impactFromImportance(Number(x.Importance ?? x.importance ?? 1)),
      expected: expected ? String(expected) : undefined,
      prior: prior ? String(prior) : undefined,
      consensusRange: undefined,
      guidance: undefined,
      watch: [], // filled later by cross-market mapping rules
      notes: notesParts.length ? notesParts.join(" • ") : String(x.Reference ?? x.Notes ?? ""),
    } satisfies CalendarEvent
  })

  return out.sort((a, b) => a.ts - b.ts)
}

function sentimentFromText(text: string): SentimentLabel {
  const t = text.toLowerCase()
  if (t.includes("risk-off") || t.includes("selloff") || t.includes("plunge") || t.includes("worry")) return "Risk-Off"
  if (t.includes("risk-on") || t.includes("rally") || t.includes("surge") || t.includes("optimism")) return "Risk-On"
  if (t.includes("inflation") && (t.includes("rise") || t.includes("hot") || t.includes("higher"))) return "Inflationary"
  if (t.includes("inflation") && (t.includes("cool") || t.includes("lower") || t.includes("ease"))) return "Deflationary"
  if (t.includes("beat") || t.includes("strong") || t.includes("up")) return "Bullish"
  if (t.includes("miss") || t.includes("weak") || t.includes("down")) return "Bearish"
  return "Neutral"
}

export async function teNewsLatest(limit = 20): Promise<MarketEvent[]> {
  const c = encodeURIComponent(teCred())
  const q = new URLSearchParams()
  q.set("c", c)
  const url = `${BASE}/news?${q.toString()}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`TE news failed: ${res.status}`)
  const raw = (await res.json()) as any[]

  const items = raw.slice(0, limit).map((x, i) => {
    const title = String(x.Title ?? x.title ?? "News")
    const summary = String(x.Description ?? x.description ?? x.Summary ?? "")
    const ts = safeTs(String(x.Date ?? x.date ?? x.Updated ?? ""))

    const sentiment = sentimentFromText(`${title} ${summary}`)
    const impact: Impact =
      sentiment === "Risk-Off" || sentiment === "Risk-On" ? "High" : summary.length > 220 ? "Medium" : "Low"

    const source: SourceKind = "News"
    const confidence = impact === "High" ? 0.68 : impact === "Medium" ? 0.58 : 0.5

    return {
      id: String(x.Id ?? x.id ?? `te-news-${ts}-${i}`),
      ts,
      title,
      summary,
      source,
      impact,
      assets: [],
      tags: ["te", "news"],
      sentiment,
      confidence,
      whyItMatters: "Headline-driven repricing can move risk, rates, and FX quickly—especially near macro windows.",
      expected: "If confirmed by rates/flows, price tends to follow-through; otherwise, fades are common.",
      reactionPlan: "Avoid chasing first candle. Wait for confirmation (rates + risk proxy alignment), then execute at structure.",
      links: x.Url ? [{ label: "Source", href: String(x.Url) }] : undefined,
    } satisfies MarketEvent
  })

  return items.sort((a, b) => b.ts - a.ts)
}
