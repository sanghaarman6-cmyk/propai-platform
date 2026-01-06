export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { computeMetrics } from "@/lib/rules/computeMetrics"
import { ingestTrades } from "@/lib/ingest/ingestTrades"
import { normalizeMT5Trade } from "@/lib/ingest/normalizeMT5Trade"

/* ------------------------------------------------------------------
   ENV
------------------------------------------------------------------ */
const VPS_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!
const BRIDGE_SECRET = process.env.BRIDGE_SECRET!


/* ------------------------------------------------------------------
   SUPABASE (SERVICE ROLE ONLY)
------------------------------------------------------------------ */
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* ------------------------------------------------------------------
   OPTIONS (Cloudflare / preflight)
------------------------------------------------------------------ */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 204 })
}

/* ------------------------------------------------------------------
   ROUTE
------------------------------------------------------------------ */
export async function POST(req: Request) {
  console.log("WORKER_SECRET ENV =", process.env.MT5_WORKER_SECRET)

  console.log("🔥 /api/mt5/sync HIT")

  /* -----------------------------
     BODY
  ----------------------------- */
  const body = await req.json().catch(() => ({} as any))
  const accountId = body?.accountId

  if (!accountId) {
    return NextResponse.json(
      { ok: false, error: "Missing accountId" },
      { status: 400 }
    )
  }

  /* -----------------------------
     LOAD ACCOUNT
  ----------------------------- */
  const { data: account } = await adminSupabase
    .from("trading_accounts")
    .select("login, server, password, baseline_balance")
    .eq("id", accountId)
    .single()

  if (!account) {
    return NextResponse.json(
      { ok: false, error: "Account not found" },
      { status: 404 }
    )
  }

  /* -----------------------------
     CONNECT MT5
  ----------------------------- */
  const connectRes = await fetch(`${VPS_BASE}/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bridge-secret": BRIDGE_SECRET,
    },
    body: JSON.stringify({
      login: account.login,
      server: account.server,
      password: account.password,
    }),
    cache: "no-store",
  })

  if (!connectRes.ok) {
    const err = await connectRes.text()
    return NextResponse.json(
      { ok: false, error: "MT5 connect failed", details: err },
      { status: 401 }
    )
  }

  /* -----------------------------
     FETCH DATA
  ----------------------------- */
  const [accountRes, historyRes] = await Promise.all([
    fetch(`${VPS_BASE}/account`, {
      headers: { "x-bridge-secret": BRIDGE_SECRET },
      cache: "no-store",
    }),
    fetch(`${VPS_BASE}/history/closed?days=3650`, {
      headers: { "x-bridge-secret": BRIDGE_SECRET },
      cache: "no-store",
    }),
  ])

  const mt5Account = await accountRes.json()
  const trades = historyRes.ok ? await historyRes.json() : []

    /* -----------------------------
      INIT BASELINE (ONE-TIME)
    ----------------------------- */
    const initialBaseline =
      account.baseline_balance ?? mt5Account.balance

    // If baseline_balance is NULL/0, set it ONCE to the first real MT5 balance
    if (!account.baseline_balance || account.baseline_balance <= 0) {
      await adminSupabase
        .from("trading_accounts")
        .update({ baseline_balance: mt5Account.balance })
        .eq("id", accountId)
    }

  /* -----------------------------
     INGEST TRADES
  ----------------------------- */
  const { data: owner } = await adminSupabase
    .from("trading_accounts")
    .select("user_id")
    .eq("id", accountId)
    .single()

  if (owner?.user_id && Array.isArray(trades)) {
    const normalized = trades
      .filter((t: any) => t?.ticket)
      .map((t: any) =>
        normalizeMT5Trade(t, owner.user_id, accountId)
      )

    await ingestTrades(normalized)
  }

  /* -----------------------------
     METRICS
  ----------------------------- */
  const baseline = initialBaseline


  const metrics = computeMetrics({
    equity: mt5Account.equity,
    balance: mt5Account.balance,
    baselineBalance: baseline,
    trades,
  })

  await adminSupabase
    .from("trading_accounts")
    .update({
      balance: mt5Account.balance,
      equity: mt5Account.equity,
      baseline_balance:
        account.baseline_balance ?? mt5Account.balance,
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", accountId)

  return NextResponse.json({ ok: true, metrics })
}
