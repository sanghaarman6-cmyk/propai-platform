import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { normalizeFirmKey } from "@/lib/rules/normalizeFirm"
import { inferPhase } from "@/lib/rules/inferPhase"
import {
  FIRM_TEMPLATES,
  FirmTemplate,
} from "@/lib/rules/firmTemplates"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { accountId, firmDetected, metrics } = await req.json()

  if (!accountId || !firmDetected) {
    return NextResponse.json(
      { error: "Missing accountId or firmDetected" },
      { status: 400 }
    )
  }

  const firmKey = normalizeFirmKey(firmDetected)
  const phase = inferPhase(metrics)

  // ✅ CORRECT: find firm template from array
  const template = FIRM_TEMPLATES.find(
    (t): t is FirmTemplate => t.name === firmKey
  )

  let rules: string[] = []

  if (template) {
    if (phase === "evaluation") {
      rules = template.evaluation ?? []
    } else if (phase === "funded") {
      rules = template.funded ?? []
    }
  }

  const { data, error } = await supabase
    .from("account_rules")
    .upsert(
      {
        account_id: accountId,
        firm_key: firmKey,
        phase,
        rules,
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
