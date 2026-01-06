// lib/fundamentals/ai/generate.ts
import "server-only"
import type { AIEventInsight } from "./types"
import { coerceInsight } from "./utils"
import { openai } from "@/lib/openai/server"

type Kind = "event" | "calendar" | "central_bank"

export async function generateInsight(kind: Kind, payload: any): Promise<{ insight: AIEventInsight; model: string }> {
const system = `
You are a senior macro market analyst.
Explain the input in extremely simple terms for discretionary traders.

CRITICAL RULES:
- If the event is a holiday, speech without policy guidance, or operational release:
  → DO NOT discuss interest rate changes, yield curves, or monetary policy shifts.
  → Focus ONLY on liquidity, participation, volatility, and execution conditions.
- If there is NO policy decision or guidance, say so explicitly.

Rules:
- No hype.
- No predictions beyond common market reactions.
- No jargon. If you must use a term, define it simply.
- Focus on how traders should THINK and manage risk (not trade signals).
- Be specific and practical. Avoid vague filler.
- Output STRICT JSON only. No markdown. No extra text.
`


const user = `
KIND: ${kind}

INPUT (JSON):
${JSON.stringify(payload, null, 2)}

Return STRICT JSON using this exact schema:

{
  "simpleSummary": string,

  "whyItMatters": {
    "headline": string,
    "bullets": string[],
    "macroContext": string
  },

  "marketImpact": {
    "equities": "Bullish|Bearish|Neutral",
    "fx": "Bullish|Bearish|Neutral",
    "rates": "Bullish|Bearish|Neutral",
    "metals": "Bullish|Bearish|Neutral",
    "crypto": "Bullish|Bearish|Neutral"
  },

  "affectedSymbols": string[],

  "scenarios": [
    {
      "name": string,
      "description": string,
      "likelyMoves": string[]
    }
  ],

  "howToInterpret": string[],
  "howToTrade": string[],
  "keyLevelsOrTriggers": string[],

  "riskLevel": "Low|Medium|High",
  "confidence": number,
  "disclaimer": string
}

Guidelines:
You must explain:
- what would surprise the market
- what would NOT matter
- which asset usually reacts first
- when traders should do nothing
- Provide at least 3 bullets for whyItMatters
- Provide at least 3 bullets for howToTrade
- Avoid generic risk management advice

- Explain like to a discretionary trader, not an economist
- Focus on cause → effect → second-order impact
- Mention WHICH markets react first, then which follow
- Avoid trade signals; focus on risk + context
- Confidence should reflect data clarity (30–80 typical)
`


  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: system.trim() },
      { role: "user", content: user.trim() },
    ],
    response_format: { type: "json_object" } as any,
  })

  const model = resp.model ?? "unknown"
  const raw = resp.choices?.[0]?.message?.content ?? "{}"

  let parsed: any = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = {}
  }

  return { insight: coerceInsight(parsed), model }
}
