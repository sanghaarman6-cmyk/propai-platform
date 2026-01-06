import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"

const VPS_BASE = process.env.NEXT_PUBLIC_API_BASE_URL! // e.g. https://api.propguru.app (caddy -> VPS)
const BRIDGE_SECRET = process.env.BRIDGE_SECRET!

// service role for ownership check (server-side only)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getAuthedSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 })
        },
      },
    }
  )
}

export async function POST(req: Request) {
  try {
    const supabase = await getAuthedSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({} as any))
    const accountId = body?.accountId as string | undefined
    const path = (body?.path as string | undefined) ?? null

    // Always treat ping as priority intent from an active user
    const priority = body?.priority === false ? false : true

    if (!accountId) {
      return NextResponse.json({ ok: false, error: "Missing accountId" }, { status: 400 })
    }

    // ✅ Safety: ensure this account belongs to the logged-in user
    const { data: acc, error: accErr } = await adminSupabase
      .from("trading_accounts")
      .select("id,user_id")
      .eq("id", accountId)
      .single()

    if (accErr || !acc || acc.user_id !== user.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    // ✅ Forward to VPS worker queue (NO MT5 touched here)
    const vpsRes = await fetch(`${VPS_BASE}/ping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bridge-secret": BRIDGE_SECRET,
      },
      body: JSON.stringify({ accountId, priority, path }),
      cache: "no-store",
    })

    const vpsJson = await vpsRes.json().catch(() => ({}))
    if (!vpsRes.ok) {
      return NextResponse.json(
        { ok: false, error: "Worker ping failed", details: vpsJson },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, ...vpsJson })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Ping error" },
      { status: 500 }
    )
  }
}
