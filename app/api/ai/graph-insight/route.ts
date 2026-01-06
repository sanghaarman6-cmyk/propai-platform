import { NextResponse } from "next/server"
import { openai } from "@/lib/openai/server"

export async function POST(req: Request) {
  try {
    const { metrics, equityCurve, tradesCount } = await req.json()

    if (!metrics || !equityCurve || equityCurve.length < 2) {
      return NextResponse.json(
        { error: "Insufficient data for graph analysis" },
        { status: 400 }
      )
    }

    // summarize equity curve
    const peak = Math.max(...equityCurve)
    const trough = Math.min(...equityCurve)
    const maxDD =
      peak > 0 ? ((peak - trough) / peak).toFixed(3) : "0"

    const slimMetrics = {
      performance: metrics.performance,
      statistics: metrics.statistics,
      risk: metrics.risk,
      derived: {
        max_drawdown_estimate: maxDD,
        trades_count: tradesCount
      }
    }

const prompt = `
You are a trading performance analyst.

Analyze the trader's GRAPH BEHAVIOR and classify the regime.

STRICT RULES:
- No chat tone
- No questions
- Be concise
- Max 2 lines per section
- Do NOT add extra sections

Return EXACTLY in this format:

REGIME:
<one of: STABLE / CAUTION / HIGH RISK>

EQUITY BEHAVIOR:
<what the equity curve shows>

DRAWDOWN STRUCTURE:
<what drives drawdowns>

EXPECTANCY HEALTH:
<what rolling expectancy implies>

STRATEGIC FOCUS:
<one high-level focus>

Data snapshot:
${JSON.stringify(slimMetrics)}
`


    const res = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 220
    })

    const text = res.choices[0]?.message?.content?.trim()
    if (!text) throw new Error("Empty AI response")

    return NextResponse.json({ text })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Graph AI failed" },
      { status: 500 }
    )
  }
}
