import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  console.log("🔥 MT5 CONNECT — HIT")

  const { userId, login, password, server } = await req.json()

  if (!userId || !login || !password || !server) {
    return NextResponse.json(
      { error: "Missing user / login / password / server" },
      { status: 400 }
    )
  }

  // 🔍 1️⃣ CHECK FOR EXISTING ACCOUNT
  const { data: existing } = await supabase
    .from("trading_accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("login", login)
    .eq("server", server)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      {
        error:
          "This MT5 account is already connected to your profile.",
      },
      { status: 409 } // 👈 important
    )
  }

  // 🧠 TODO: real MT5 bridge auth already working on your VPS
  const accountData = {
    user_id: userId,
    platform: "mt5",
    login,
    server,
    name: `MT5 ${login}`,
    balance: 100000,
    equity: 99850,
    currency: "USD",
    status: "connected",
  }

  const { data, error } = await supabase
    .from("trading_accounts")
    .insert(accountData)
    .select()
    .single()

  if (error) {
    console.error("❌ INSERT FAILED:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  console.log("✅ ACCOUNT CREATED:", data.id)

  return NextResponse.json(data)
}
