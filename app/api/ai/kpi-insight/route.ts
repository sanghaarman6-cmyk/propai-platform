import { NextResponse } from "next/server"
import { openai } from "@/lib/openai/server"

export async function POST(req: Request) {
  const { kpi, value, metrics } = await req.json()
  const slimMetrics = {
    performance: metrics?.performance,
    statistics: metrics?.statistics,
    risk: metrics?.risk
  }


const prompt = `
You are a trading analytics explainer.

Explain the metric "${kpi}" using the following structure.

Rules:
- No chat tone
- No questions
- Be concise
- Max 2 lines per section

Return EXACTLY in this format:

MEANING:
<what this metric measures>

YOUR READING:
<what the trader's value implies>

WHY THIS LOOKS THIS WAY:
<primary cause based on metrics>

NEXT ADJUSTMENT:
<one concrete improvement action>

Metric value: ${value}

Metrics snapshot:
${JSON.stringify(slimMetrics)}
`


  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200
  })

  return NextResponse.json({
    text: res.choices[0].message.content?.trim() ?? ""
  })
}
