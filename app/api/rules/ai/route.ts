import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

type AIRule = {
  title: string
  description: string
  severity: "critical" | "warning" | "info"
  limit?: string | null
  ai_advice: string
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const accountId: string | undefined = body?.accountId

  if (!accountId) {
    return NextResponse.json(
      { error: "Missing accountId" },
      { status: 400 }
    )
  }

  // 1️⃣ Load account metadata (source of truth)
  const { data: account, error: acctErr } = await supabase
    .from("trading_accounts")
    .select("id, firm_detected, name, server, platform")
    .eq("id", accountId)
    .single()

  if (acctErr || !account) {
    return NextResponse.json(
      { error: acctErr?.message || "Account not found" },
      { status: 404 }
    )
  }

  if (!account.firm_detected) {
    return NextResponse.json(
      {
        error:
          "firm_detected is missing. Run MT5 sync first so the firm can be identified.",
      },
      { status: 400 }
    )
  }

  // 2️⃣ AI PROMPT — VERY STRICT
  const prompt = `
You are a professional proprietary trading risk analyst.

Firm: ${account.firm_detected}
Account Name: ${account.name ?? "Unknown"}
Server: ${account.server ?? "Unknown"}
Platform: ${account.platform ?? "Unknown"}

TASK:
Infer the trading rules that apply to this account.

IMPORTANT:
- You MUST return VALID JSON
- DO NOT include explanations outside JSON
- DO NOT return empty rules
- Severity meanings:
  - "critical": breaking this fails the account
  - "warning": dangerous but not instant failure
  - "info": guidance / best practice

RETURN EXACTLY THIS FORMAT:

{
  "phase": "evaluation" | "funded",
  "rules": [
    {
      "title": string,
      "description": string,
      "severity": "critical" | "warning" | "info",
      "limit": string | null,
      "ai_advice": string
    }
  ],
  "confidence": number
}
`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
  })

  let parsed: any
  try {
    parsed = JSON.parse(
      completion.choices[0]?.message?.content ?? "{}"
    )
  } catch {
    return NextResponse.json(
      { error: "AI response invalid JSON" },
      { status: 500 }
    )
  }

  // 3️⃣ Normalize & validate output
  const phase =
    parsed?.phase === "funded" ? "funded" : "evaluation"

  const confidence =
    typeof parsed?.confidence === "number"
      ? parsed.confidence
      : 0.5

  const rules: AIRule[] = Array.isArray(parsed?.rules)
    ? parsed.rules
        .filter((r: any) => r?.title && r?.description)
        .map((r: any) => ({
          title: String(r.title),
          description: String(r.description),
          severity:
            r.severity === "critical" ||
            r.severity === "warning" ||
            r.severity === "info"
              ? r.severity
              : "info",
          limit:
            r.limit !== undefined && r.limit !== null
              ? String(r.limit)
              : null,
          ai_advice: String(
            r.ai_advice ??
              "Trade cautiously and monitor this rule closely."
          ),
        }))
    : []

  // 4️⃣ Persist to DB
  const { data, error } = await supabase
    .from("account_rules")
    .upsert(
      {
        account_id: accountId,
        firm_key: account.firm_detected,
        phase,
        rules,
        confidence,
        inferred_at: new Date().toISOString(),
      },
      { onConflict: "account_id" }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
