// lib/news/forexfactory.ts

export type FFImpact = "Low" | "Medium" | "High" | "Holiday" | string

export type ForexFactoryRawEvent = {
  title: string
  country: string // actually currency code in this feed (USD, EUR, JPY, etc.)
  date: string // ISO with offset, e.g. 2025-12-30T14:00:00-05:00
  impact: FFImpact
  forecast?: string
  previous?: string
}

export type Impact = "Low" | "Medium" | "High" | "None"


export type EconEvent = {
  id: string
  title: string
  country: string
  currency: string
  impact: Impact
  datetimeISO: string
  forecast?: string
  previous?: string
  actual?: string
  note?: string
  affectedSymbols: string[]
  source: "ForexFactory"
  isHoliday?: boolean
}

function stableId(input: string) {
  // tiny deterministic hash -> stable IDs for React keys
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `ff_${(h >>> 0).toString(16)}`
}

function mapImpact(impact: FFImpact): { impact: Impact; isHoliday: boolean } {
  const x = String(impact).toLowerCase()

  if (x.includes("high")) {
    return { impact: "High", isHoliday: false }
  }

  if (x.includes("medium") || x.includes("med")) {
    return { impact: "Medium", isHoliday: false }
  }

  if (x.includes("low")) {
    // LOW economic impact (green)
    return { impact: "Low", isHoliday: false }
  }

  if (x.includes("holiday")) {
    // NON-ECONOMIC (gray)
    return { impact: "None", isHoliday: true }
  }

  // Any unknown / speech / misc → non-economic
  return { impact: "None", isHoliday: false }
}


function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr))
}

/**
 * Basic, deterministic "affected symbols" mapping.
 * You can refine this later with your own symbol universe (MT5 symbols, CFD indices, etc.)
 */
export function computeAffectedSymbols(currency: string): string[] {
  const c = currency.toUpperCase()

  const fxMajorsByCurrency: Record<string, string[]> = {
    USD: ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD", "XAUUSD", "BTCUSD", "US30", "US100", "US500"],
    EUR: ["EURUSD", "EURGBP", "EURJPY", "EURCHF", "EURAUD", "GER40"],
    GBP: ["GBPUSD", "EURGBP", "GBPJPY", "GBPAUD", "UK100"],
    JPY: ["USDJPY", "EURJPY", "GBPJPY", "AUDJPY", "JP225"],
    AUD: ["AUDUSD", "AUDJPY", "EURAUD", "GBPAUD"],
    NZD: ["NZDUSD", "NZDJPY", "AUDNZD"],
    CAD: ["USDCAD", "CADJPY"],
    CHF: ["USDCHF", "EURCHF", "CHFJPY"],
    CNY: ["USDCNH"], // common proxy
  }

  return uniq(fxMajorsByCurrency[c] ?? [c])
}

export function normalizeForexFactory(
  raw: ForexFactoryRawEvent[],
  opts?: { includeHolidays?: boolean }
): EconEvent[] {
  const includeHolidays = opts?.includeHolidays ?? true

  const out: EconEvent[] = []

  for (const r of raw) {
    const currency = (r.country || "").toUpperCase().trim()
    const title = (r.title || "").trim()
    const dt = (r.date || "").trim()
    if (!currency || !title || !dt) continue

    const { impact, isHoliday } = mapImpact(r.impact)
    if (isHoliday && !includeHolidays) continue

    const id = stableId(`${currency}|${dt}|${title}`)

    out.push({
      id,
      title,
      country: currency, // feed uses currency codes here; keep consistent
      currency,
      impact,
      datetimeISO: new Date(dt).toISOString(), // normalize to UTC ISO
      forecast: (r.forecast ?? "").trim() || undefined,
      previous: (r.previous ?? "").trim() || undefined,
      note: isHoliday ? "Market holiday (from FF weekly feed)" : undefined,
      affectedSymbols: computeAffectedSymbols(currency),
      source: "ForexFactory",
      isHoliday,
    })
  }

  // sort ascending
  out.sort((a, b) => new Date(a.datetimeISO).getTime() - new Date(b.datetimeISO).getTime())
  return out
}
