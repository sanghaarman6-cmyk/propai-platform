import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { detectPropFirm } from "@/lib/rules/detectFirm"
import { normalizeFirmKey } from "@/lib/rules/normalizeFirm"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VPS_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!
const BRIDGE_SECRET = process.env.BRIDGE_SECRET!

export async function POST(req: Request) {
  console.log("🔥 MT5 CONNECT — HIT")

  const body = await req.json()

  const {
    userId,
    label,
    login,
    password,
    server,
  } = body as {
    userId: string
    label?: string | null
    login: number
    password: string
    server: string
  }

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  if (!login || !password || !server) {
    return NextResponse.json(
      { error: "Missing login / password / server" },
      { status: 400 }
    )
  }

  /* -------------------------------------------------
     1️⃣ VALIDATE MT5 CREDENTIALS VIA VPS (CRITICAL)
  -------------------------------------------------- */
  const vpsRes = await fetch(`${VPS_BASE}/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bridge-secret": BRIDGE_SECRET,
    },
    body: JSON.stringify({
      login,
      password,
      server,
    }),
    cache: "no-store",
  })

  const vpsJson = await vpsRes.json().catch(() => ({}))

  if (!vpsRes.ok) {
    console.error("❌ VPS MT5 CONNECT FAILED", vpsJson)

    return NextResponse.json(
      {
        error: "Invalid MT5 credentials",
        details: vpsJson?.details ?? vpsJson?.error ?? null,
      },
      { status: 401 }
    )
  }

  /* -------------------------------------------------
     2️⃣ DETECT PROP FIRM (SAFE NOW)
  -------------------------------------------------- */
  const firmDetected = detectPropFirm(`MT5 ${login}`, server)
  const firmKey = normalizeFirmKey(firmDetected)

  /* -------------------------------------------------
     3️⃣ SAVE ACCOUNT ONLY AFTER VALIDATION
  -------------------------------------------------- */
  const { data, error } = await supabase
    .from("trading_accounts")
    .upsert(
      {
        user_id: userId,
        platform: "mt5",
        login,
        server,
        password,
        label: label ?? null,
        name: `MT5 ${login}`,

        status: "connected",

        firm_detected: firmDetected,
        firm_key: firmKey,
      },
      { onConflict: "user_id,login,server" }
    )
    .select()
    .single()

  if (error) {
    console.error("❌ UPSERT FAILED", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("✅ ACCOUNT SAVED FOR USER:", userId)

  return NextResponse.json(data)
}
