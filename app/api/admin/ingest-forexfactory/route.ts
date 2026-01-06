// app/api/admin/ingest-forexfactory/route.ts
import { NextResponse } from "next/server"
import { normalizeForexFactory } from "@/lib/news/forexfactory"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const url = new URL(req.url)
  const got = url.searchParams.get("secret")
  const expected = process.env.NEWS_INGEST_SECRET
  if (!expected || got !== expected) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    )
  }


  const FEEDS = [
    { name: "thisweek", url: "https://nfs.faireconomy.media/ff_calendar_thisweek.json" },
    { name: "nextweek", url: "https://nfs.faireconomy.media/ff_calendar_nextweek.json" },
  ]

  const rawEvents: any[] = []

  for (const f of FEEDS) {
    // cache-bust + disable Next caching
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

    console.log(`[FF] ${f.name} status=${res.status} bytes=${text.length}`)

    if (!res.ok) {
      console.warn(`[FF] ${f.name} FAILED body:`, text.slice(0, 200))
      continue
    }

    // parse JSON safely
    let json: any
    try {
      json = JSON.parse(text)
    } catch (e) {
      console.warn(`[FF] ${f.name} JSON parse failed. body:`, text.slice(0, 200))
      continue
    }

    if (!Array.isArray(json)) {
      console.warn(`[FF] ${f.name} not an array. body:`, text.slice(0, 200))
      continue
    }

    console.log(`[FF] ${f.name} events=${json.length}`)

    rawEvents.push(...json)
  }

  if (rawEvents.length === 0) {
    return NextResponse.json({ ok: false, error: "no_raw_events" }, { status: 502 })
  }

  // Helpful max-date debug
  const maxRaw = new Date(
    Math.max(...rawEvents.map((e: any) => new Date(e.date).getTime()))
  ).toISOString()
  console.log("RAW EVENTS COUNT", rawEvents.length)
  console.log("RAW MAX DATE", maxRaw)

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
    console.error(error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: events.length, maxRaw })
}
