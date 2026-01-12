// app/api/admin/ingest-forexfactory/route.ts
import { NextResponse } from "next/server"
import { normalizeForexFactory } from "@/lib/news/forexfactory"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function ingest() {
  const FEEDS = [
    { name: "thisweek", url: "https://nfs.faireconomy.media/ff_calendar_thisweek.json" },
    { name: "nextweek", url: "https://nfs.faireconomy.media/ff_calendar_nextweek.json" },
  ]

  const rawEvents: any[] = []

  for (const f of FEEDS) {
    const u = new URL(f.url)
    u.searchParams.set("v", String(Date.now()))

    const res = await fetch(u.toString(), {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PropGuru/1.0)",
        Accept: "application/json",
      },
    })

    if (!res.ok) continue

    let json: any
    try {
      json = await res.json()
    } catch {
      continue
    }

    if (Array.isArray(json)) rawEvents.push(...json)
  }

  if (!rawEvents.length) {
    return NextResponse.json({ ok: false, error: "no_raw_events" }, { status: 502 })
  }

  const events = normalizeForexFactory(rawEvents, { includeHolidays: true })

  // 🔒 DEFENSIVE NORMALIZATION (THIS IS THE IMPORTANT PART)
  const rows = events
    .filter(e => e.id && e.datetimeISO)
    .map(e => ({
      id: e.id,
      title: e.title ?? "",
      country: e.country ?? null,
      currency: e.currency ?? null,

      // normalize enum
      impact: e.impact === "Holiday" ? "Low" : e.impact ?? "Low",

      // force valid timestamptz
      datetime_iso: new Date(e.datetimeISO).toISOString(),

      // empty string → null (critical)
      forecast: e.forecast && e.forecast.trim() !== "" ? e.forecast : null,
      previous: e.previous && e.previous.trim() !== "" ? e.previous : null,
      actual: e.actual && String(e.actual).trim() !== "" ? e.actual : null,

      note: e.note ?? null,

      // always array
      affected_symbols: Array.isArray(e.affectedSymbols)
        ? e.affectedSymbols
        : [],

      source: "ForexFactory",
    }))

  const { error } = await supabase
    .from("news_events")
    .upsert(rows, { onConflict: "id" })

  if (error) {
    console.error("SUPABASE UPSERT ERROR:", error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, count: rows.length })
}

// ✅ Vercel Cron
export async function GET() {
  return ingest()
}

// ✅ Optional manual trigger
export async function POST() {
  return ingest()
}
