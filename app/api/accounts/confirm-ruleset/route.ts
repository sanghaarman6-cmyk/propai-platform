import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { resolveRuleset } from "@/lib/prop-firms"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const {
      accountId,
      firmKey,
      program,
      phase,
      accountSize,
    } = await req.json()

    if (!accountId || !firmKey || !program || !phase || !accountSize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const tpl = resolveRuleset({
      firmKey,
      program,
      phase,
      accountSize,
    })

    if (!tpl) {
      return NextResponse.json(
        { error: "Invalid firm/program/phase/size selection" },
        { status: 400 }
      )
    }

    const { data: account, error } = await supabase
      .from("trading_accounts")
      .select("baseline_balance, balance")
      .eq("id", accountId)
      .single()

    if (error || !account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      )
    }

    const baselineBalance =
      account.baseline_balance ?? account.balance

    if (!baselineBalance || baselineBalance <= 0) {
      return NextResponse.json(
        { error: "Invalid baseline balance" },
        { status: 400 }
      )
    }

    // ✅ EXACT DB SNAPSHOT
    const ruleset = {
      firmKey,
      program,
      phase,
      accountSize,
      drawdown: tpl.drawdown,
      profitTargetPct: tpl.profitTargetPct,
      rules: tpl.rules,
    }

    const { error: updateError } = await supabase
      .from("trading_accounts")
      .update({
        firm_key: firmKey,
        firm_name: tpl.firmName ?? null,

        program,
        program_key: program, // 🔥 THIS WAS NEVER SET
        phase,
        account_size: accountSize,

        ruleset, // ✅ CORRECT COLUMN
        baseline_balance: baselineBalance,

        rules_confirmed: true,
        rules_confirmed_at: new Date().toISOString(),
      })
      .eq("id", accountId)


    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      ruleset,
      baselineBalance,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
