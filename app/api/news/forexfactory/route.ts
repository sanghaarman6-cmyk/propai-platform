// app/api/news/forexfactory/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export async function GET() {
  const from = new Date()
from.setDate(from.getDate() - from.getDay() + (from.getDay() === 0 ? -6 : 1))
from.setHours(0, 0, 0, 0)


  const to = new Date()
  to.setDate(to.getDate() + 30)

  const { data, error } = await supabase
    .from("news_events")
    .select("*")
    .gte("datetime_iso", from.toISOString())
    .lte("datetime_iso", to.toISOString())
    .order("datetime_iso", { ascending: true })

  if (error) {
    return NextResponse.json({ events: [] }, { status: 500 })
  }

  return NextResponse.json({
    source: "ForexFactory (cached)",
    range: "thisweek+nextweek",
    events: data.map((e) => ({
      id: e.id,
      title: e.title,
      country: e.country,
      currency: e.currency,
      impact: e.impact,
      datetimeISO: e.datetime_iso,
      forecast: e.forecast,
      previous: e.previous,
      actual: e.actual,
      note: e.note,
      affectedSymbols: e.affected_symbols,
    })),
  })
}
