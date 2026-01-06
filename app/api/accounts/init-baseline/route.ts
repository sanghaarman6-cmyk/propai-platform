import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { accountId, baselineBalance } = await req.json()

    if (!accountId || !baselineBalance || baselineBalance <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 🔒 Set baseline ONCE only
    const { error } = await supabase
      .from("trading_accounts")
      .update({
        baseline_balance: baselineBalance,
      })
      .eq("id", accountId)
      .eq("user_id", user.id)
      .is("baseline_balance", null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
