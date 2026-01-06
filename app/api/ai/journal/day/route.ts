import "server-only"
import { NextResponse } from "next/server"
import { openai } from "@/lib/openai/server"

type Payload = {
  date: string
  stats: {
    net: number
    winRate: number
    avgPnL: number
    trades: number
  }
  trades: Array<{
    symbol: string
    side: "long" | "short"
    pnl: number
    time: string
  }>
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload

    if (!body?.date || !body?.stats || !body?.trades) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 })
    }

    const trades = body.trades.slice(0, 50) // hard cap

    const prompt = `
You are a trading journal coach.

Return JSON ONLY with this exact shape:
{
  "headline": string,
  "summary": string,
  "patterns": string[],
  "risks": string[],
  "adjustment": string
}

Rules:
- headline: short, blunt, 6–10 words
- summary: 3–4 full sentences, concrete and specific
- patterns: exactly 2–3 bullets
- risks: exactly 1–2 bullets
- adjustment: ONE actionable rule for the next session
- Never be vague
- No motivational fluff


Rules:
- Be blunt and specific
- No motivational fluff
- mistakes / strengths: max 3 bullets
- rule: ONE concrete rule for next time

DATE: ${body.date}

STATS:
net=${body.stats.net}
winRate=${body.stats.winRate}
avgPnL=${body.stats.avgPnL}
trades=${body.stats.trades}

TRADES (time | symbol | side | pnl):
${trades.map(t => `${t.time} | ${t.symbol} | ${t.side} | ${t.pnl}`).join("\n")}
`

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Output strict JSON only. No markdown." },
        { role: "user", content: prompt }
      ]
    })

    const text = res.choices?.[0]?.message?.content ?? "{}"

    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 })
    }

    return NextResponse.json(json)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}
