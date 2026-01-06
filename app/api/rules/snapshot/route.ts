import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

import { evaluateRules } from "@/lib/rules/evaluateRules"
import { buildAccountMetrics } from "@/lib/rules/buildAccountMetrics"
import { mapAccountToRuleKeys } from "@/lib/rules/mapAccountToRuleKeys"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get("accountId")

  if (!accountId) {
    return NextResponse.json(
      { error: "Missing accountId" },
      { status: 400 }
    )
  }

  // ✅ cookies() IS ASYNC IN NEXT 16
  const cookieStore = await cookies()

  // ✅ LEGACY-COMPATIBLE SUPABASE CLIENT
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // --- AUTH ---
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // --- ACCOUNT ---
  const { data: account, error: accErr } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .single()

  if (accErr || !account) {
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404 }
    )
  }

  const { firm_key, phase, program } = mapAccountToRuleKeys(account)

  const version = 1
  console.log("LOOKING FOR RULES WITH:")
  console.log({
    firm_key,
    phase,
    program,
    version,
  })

  // --- RULES ---
  const { data: firmRules, error: rulesErr } = await supabase
    .from("firm_rules_structured")
    .select("rules")
    .eq("firm_key", firm_key)
    .eq("phase", phase)
    .eq("program", program)
    .eq("version", version)
    .single()

  if (rulesErr || !firmRules) {
    return NextResponse.json(
      { error: "No structured rules found" },
      { status: 404 }
    )
  }

  // --- METRICS ---
  const metrics = await buildAccountMetrics(supabase, {
    userId: user.id,
    accountId,
    account,
  })

  // --- EVALUATE ---
  const snapshot = evaluateRules({
    firm_key,
    phase,
    program,
    version,
    rules: firmRules.rules,
    metrics,
  })

  // --- CACHE SNAPSHOT ---
  await supabase.from("account_rule_snapshots").upsert({
    user_id: user.id,
    account_id: account.id,
    firm_key,
    phase,
    program,
    rules_version: version,
    snapshot,
    computed_at: new Date().toISOString(),
  })

  return NextResponse.json({
    firm_key,
    phase,
    program,
    computed_at: new Date().toISOString(),
    ...snapshot,
  })
}
