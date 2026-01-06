import type { CalendarEvent } from "@/lib/fundamentals/types"
import { headers } from "next/headers"

function guessAssets(currency?: string): string[] {
  if (!currency) return []
  switch (currency) {
    case "USD":
      return ["DXY", "US10Y", "NAS100", "SPX500", "XAUUSD"]
    case "EUR":
      return ["EURUSD"]
    case "GBP":
      return ["GBPUSD"]
    case "JPY":
      return ["USDJPY"]
    default:
      return []
  }
}

export async function ffCalendar(): Promise<CalendarEvent[]> {
  console.log("🟢 ffCalendar() CALLED")

  const h = await headers()
  const host = h.get("host")
  const proto = process.env.NODE_ENV === "development" ? "http" : "https"
  const url = `${proto}://${host}/api/news/forexfactory`

  console.log("🟡 ffCalendar fetch URL:", url)

  const res = await fetch(url, { cache: "no-store" })

  console.log("🟠 ffCalendar res.ok:", res.ok, "status:", res.status)

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.error("🔴 ffCalendar error body:", text.slice(0, 300))
    throw new Error(`ForexFactory calendar failed: ${res.status}`)
  }

  const data = await res.json()
  console.log("🟣 ffCalendar raw events count:", data.events?.length)

  const mapped: CalendarEvent[] = (data.events ?? []).map((e: any) => ({
    id: `ff-${e.id}`,
    ts: new Date(e.datetimeISO).getTime(),
    title: e.title,
    source: "ForexFactory",
    country: e.country ?? e.currency ?? "US",
    impact: e.impact ?? "Medium",
    assets: guessAssets(e.currency),
    tags: ["calendar"],
  }))

  console.log("🔵 ffCalendar mapped count:", mapped.length)
  return mapped
}
