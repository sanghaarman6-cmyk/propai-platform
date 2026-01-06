import "server-only"
import { NextResponse } from "next/server"
import { openai } from "@/lib/openai/server"

type Payload = {
  month: string // "2026-01"
  stats: {
    net: number
    winRate: number
    avgPnL: number
    trades: number
    wins: number
    losses: number
  }
  dailyPnL: Array<{ date: string; pnl: number; trades: number }>
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload

    // Hard guardrails
    if (!body?.month || !body?.stats) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 })
    }

    // Keep payload small
    const daily = (body.dailyPnL ?? []).slice(0, 42)

    const prompt = `
You are a trading performance analyst.

Return JSON only with this exact shape:
{
  "headline": string,
  "summary": string,
  "patterns": string[],
  "risks": string[],
  "adjustment": string
}

Rules:
- Be concise and concrete (no motivational fluff).
- Use the provided stats + daily breakdown.
- patterns and risks: 2-4 bullets each.
- adjustment: one actionable rule to try next week.

MONTH: ${body.month}

STATS:
net=${body.stats.net}
winRate=${body.stats.winRate}
avgPnL=${body.stats.avgPnL}
trades=${body.stats.trades}
wins=${body.stats.wins}
losses=${body.stats.losses}

DAILY (date, pnl, trades):
${daily.map(d => `${d.date} | pnl=${d.pnl} | trades=${d.trades}`).join("\n")}
`

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You output strict JSON only. No markdown." },
        { role: "user", content: prompt }
      ]
    })

    const text = res.choices?.[0]?.message?.content ?? "{}"

    // Parse JSON safely
    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: "AI returned non-JSON" }, { status: 500 })
    }

    return NextResponse.json(json)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}
