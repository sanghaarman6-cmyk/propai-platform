import "server-only"
import { openai } from "@/lib/openai/server"
import type { AccountMetrics } from "@/lib/metrics/accountMetrics"

export type AnalyticsAIResponse = {
  snapshot: {
    edge_quality: "strong" | "neutral" | "weak"
    regime: "stable" | "volatile" | "decaying"
    confidence: number // 0..1
  }
  edge_read: string[]
  fix_rules: string[]
  next_action: string[]
}

const SYSTEM_ANALYTICS_PROMPT = `
You are an analytical trading performance engine.

Hard rules:
- You do NOT chat.
- You do NOT ask questions.
- You ONLY analyze the provided metrics.
- You ONLY return valid JSON (no markdown, no commentary).
- You MUST use ONLY these enum values:

edge_quality: one of ["strong","neutral","weak"]
regime: one of ["stable","volatile","decaying"]
confidence: number between 0 and 1

Output MUST match exactly this shape and keys:
{
  "snapshot": { "edge_quality": "strong|neutral|weak", "regime": "stable|volatile|decaying", "confidence": 0.0 },
  "edge_read": ["..."],
  "fix_rules": ["..."],
  "next_action": ["..."]
}

Do not add extra keys.
`


function buildAnalyticsPrompt(input: {
  metrics: AccountMetrics
  trade_count: number
  baseline_balance: number
}) {
  return JSON.stringify({
    task: "Analyze this trading analytics snapshot and generate insights.",
    constraints: {
      no_memory: true,
      no_intent_parsing: true,
      no_prop_firm_rules: true
    },
    context: {
      trade_count: input.trade_count,
      baseline_balance: input.baseline_balance
    },
    metrics: {
      performance: input.metrics.performance,
      statistics: input.metrics.statistics,
      risk: input.metrics.risk
    }
  })
}

function clamp01(n: any) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(1, v))
}

function normStr(x: any) {
  return String(x ?? "").trim().toLowerCase()
}

function coerceEdgeQuality(v: any): "strong" | "neutral" | "weak" {
  const s = normStr(v)

  // exact
  if (s === "strong" || s === "neutral" || s === "weak") return s

  // common synonyms
  if (["good", "high", "positive", "solid", "healthy", "excellent"].includes(s)) return "strong"
  if (["ok", "average", "mixed", "moderate", "mid"].includes(s)) return "neutral"
  if (["bad", "poor", "low", "negative", "weakness", "broken", "unstable"].includes(s)) return "weak"

  // fallback
  return "neutral"
}

function coerceRegime(v: any): "stable" | "volatile" | "decaying" {
  const s = normStr(v)

  if (s === "stable" || s === "volatile" || s === "decaying") return s

  if (["choppy", "noisy", "wild", "high-vol", "high vol", "highvol"].includes(s)) return "volatile"
  if (["deteriorating", "worsening", "downtrend", "degrading", "falling"].includes(s)) return "decaying"
  if (["consistent", "smooth", "steady"].includes(s)) return "stable"

  return "volatile"
}

function validateStrict(obj: any): AnalyticsAIResponse {
  if (!obj || typeof obj !== "object") throw new Error("AI returned non-object JSON")

  const snap = obj.snapshot
  if (!snap || typeof snap !== "object") throw new Error("Missing snapshot")

  // ✅ Coerce + normalize instead of hard failing
  const edge_quality = coerceEdgeQuality(snap.edge_quality)
  const regime = coerceRegime(snap.regime)
  const confidence = clamp01(snap.confidence)

  const edge_read = Array.isArray(obj.edge_read) ? obj.edge_read.map(String) : []
  const fix_rules = Array.isArray(obj.fix_rules) ? obj.fix_rules.map(String) : []
  const next_action = Array.isArray(obj.next_action) ? obj.next_action.map(String) : []

  return {
    snapshot: { edge_quality, regime, confidence },
    edge_read: edge_read.slice(0, 8),
    fix_rules: fix_rules.slice(0, 8),
    next_action: next_action.slice(0, 8)
  }
}

export async function generateAnalyticsInsights(input: {
  metrics: AccountMetrics
  trade_count: number
  baseline_balance: number
}): Promise<AnalyticsAIResponse> {
  const prompt = buildAnalyticsPrompt(input)

  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_ANALYTICS_PROMPT.trim() },
      { role: "user", content: prompt }
    ],
    // Helps reduce rambling
    max_tokens: 700
  })

  const raw = res.choices[0]?.message?.content?.trim()
  if (!raw) throw new Error("Empty AI response")

  // If model ever wraps with text, this tries to extract the JSON block safely.
  const jsonStart = raw.indexOf("{")
  const jsonEnd = raw.lastIndexOf("}")
  if (jsonStart === -1 || jsonEnd === -1) throw new Error("AI did not return JSON")

  const jsonStr = raw.slice(jsonStart, jsonEnd + 1)
  const parsed = JSON.parse(jsonStr)

  return validateStrict(parsed)
}
