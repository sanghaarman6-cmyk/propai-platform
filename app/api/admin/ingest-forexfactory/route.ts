// app/api/admin/ingest-forexfactory/route.ts
import { NextResponse } from "next/server"
import { normalizeForexFactory } from "@/lib/news/forexfactory"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * ForexFactory can emit "Holiday" even though our Impact type
 * is strict. We normalize at the boundary.
 */
type Impact = "Low" | "Medium" | "High"

function normalizeImpact(input: unknown): Impact {
  if (input === "High" || input === "Medium" || input === "Low") return input
  if (input === "Holiday") return "Low"
  return "Low"
}

async function ingest() {
  const FEEDS = [
    {
      name: "thisweek",
      url: "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
    },
    {
      name: "nextweek",
      url: "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
    },
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

    try {
      const json = await res.json()
      if (Array.isArray(json)) rawEvents.push(...json)
    } catch {
      continue
    }
  }

  if (!rawEvents.length) {
    return NextResponse.json(
      { ok: false, error: "no_raw_events" },
      { status: 502 }
    )
  }

  const events = normalizeForexFactory(rawEvents, {
    includeHolidays: true,
  })

  /**
   * 🔑 CRITICAL PART
   * - Deduplicate by ID (fixes Postgres 21000)
   * - Normalize empty strings → null
   * - Normalize impact enum
   * - Force valid timestamptz
   */
  const deduped = new Map<string, any>()

  for (const e of events) {
    if (!e.id || !e.datetimeISO) continue

    deduped.set(e.id, {
      id: e.id,
      title: e.title ?? "",
      country: e.country ?? null,
      currency: e.currency ?? null,

      impact: normalizeImpact(e.impact),

      datetime_iso: new Date(e.datetimeISO).toISOString(),

      forecast:
        e.forecast && e.forecast.trim() !== "" ? e.forecast : null,
      previous:
        e.previous && e.previous.trim() !== "" ? e.previous : null,
      actual:
        e.actual && String(e.actual).trim() !== "" ? e.actual : null,

      note: e.note ?? null,

      affected_symbols: Array.isArray(e.affectedSymbols)
        ? e.affectedSymbols
        : [],

      source: "ForexFactory",
    })
  }

  const rows = Array.from(deduped.values())

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

  return NextResponse.json({
    ok: true,
    inserted: rows.length,
  })
}

// ✅ Vercel Cron (GET only)
export async function GET() {
  return ingest()
}

// ✅ Optional manual trigger
export async function POST() {
  return ingest()
}
