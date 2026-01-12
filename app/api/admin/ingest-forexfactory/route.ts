// app/api/admin/ingest-forexfactory/route.ts
import { NextResponse } from "next/server"
import { normalizeForexFactory } from "@/lib/news/forexfactory"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ⬇️ THIS IS YOUR EXISTING LOGIC — UNCHANGED
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

    const text = await res.text()

    if (!res.ok) continue

    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      continue
    }

    if (Array.isArray(json)) rawEvents.push(...json)
  }

  if (!rawEvents.length) {
    return NextResponse.json({ ok: false, error: "no_raw_events" }, { status: 502 })
  }

  const maxRaw = new Date(
    Math.max(...rawEvents.map((e: any) => new Date(e.date).getTime()))
  ).toISOString()

  const events = normalizeForexFactory(rawEvents, { includeHolidays: true })

  const { error } = await supabase
    .from("news_events")
    .upsert(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        country: e.country,
        currency: e.currency,
        impact: e.impact,
        datetime_iso: e.datetimeISO,
        forecast: e.forecast,
        previous: e.previous,
        actual: e.actual,
        note: e.note,
        affected_symbols: e.affectedSymbols,
        source: "ForexFactory",
      })),
      { onConflict: "id" }
    )

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: events.length, maxRaw })
}

// ✅ VERCEL CRON USES THIS
export async function GET() {
  return ingest()
}

// ✅ OPTIONAL: keep manual trigger if you want
export async function POST() {
  return ingest()
}
