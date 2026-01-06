import "server-only"
import { NextResponse } from "next/server"
import { openai } from "@/lib/openai/server"

type Payload = {
  range: string
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

    if (!body?.range || !body?.stats || !body?.trades) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 })
    }

    const trades = body.trades.slice(0, 80)

    const prompt = `
You are a professional trading performance coach.

Return JSON ONLY with this exact shape:
{
  "headline": string,
  "summary": string,
  "patterns": string[],
  "risks": string[],
  "adjustment": string
}

Rules:
- headline: blunt, 6–10 words
- summary: 3–4 concrete sentences
- patterns: exactly 2–3 bullets
- risks: exactly 1–2 bullets
- adjustment: ONE rule for next week
- No motivation, no fluff

WEEK RANGE: ${body.range}

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
        { role: "system", content: "Return strict JSON only." },
        { role: "user", content: prompt }
      ]
    })

    const text = res.choices?.[0]?.message?.content ?? "{}"

    let json
    try {
      json = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: "Invalid AI JSON" }, { status: 500 })
    }

    return NextResponse.json(json)
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    )
  }
}
