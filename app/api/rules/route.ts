import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// very light templates for now (replace later with your full firmTemplates if you want)
function templateRules(firmKey: string) {
  // Keep these generic. We'll replace with AI results later.
  switch (firmKey) {
    case "FTMO":
      return {
        hard_rules: [
          { title: "Daily loss limit", value: "Varies by account", severity: "hard" },
          { title: "Max loss limit", value: "Varies by account", severity: "hard" },
        ],
        hidden_rules: [
          { title: "News / restricted trading", value: "May apply depending on program", severity: "soft" },
        ],
      }
    default:
      return {
        hard_rules: [{ title: "Rules not detected yet", value: "AI discovery will fill this.", severity: "hard" }],
        hidden_rules: [],
      }
  }
}

/**
 * GET /api/rules?userId=xxx&accountId=yyy|ALL
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const accountId = searchParams.get("accountId") ?? "ALL"

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  // load accounts for this user
  let query = supabase.from("trading_accounts").select("*").eq("user_id", userId)

  if (accountId !== "ALL") {
    query = query.eq("id", accountId)
  }

  const { data: accounts, error } = await query.order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const firmKeys = Array.from(
    new Set((accounts ?? []).map((a: any) => a.firm_key ?? "UNKNOWN"))
  )

  // Build response per firm
  const firms = firmKeys.map((firmKey) => {
    const t = templateRules(String(firmKey))
    return {
      firm_key: firmKey,
      hard_rules: t.hard_rules,
      hidden_rules: t.hidden_rules,
      sources: [], // AI/web sources will go here later
    }
  })

  return NextResponse.json({
    scope: accountId === "ALL" ? "ALL" : accountId,
    account_count: accounts?.length ?? 0,
    firms,
  })
}
