import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
import type { BacktestSnapshotV1 } from "@/lib/types/backtests"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function saveBacktest(args: {
  id?: string
  name: string
  notes: string | null
  snapshot: BacktestSnapshotV1
  overwrite?: boolean
}): Promise<
  | { ok: true; mode: "UPDATED"; id: string }
  | { ok: true; mode: "INSERTED"; id: string }
  | { ok: false; reason: "DUPLICATE" }
> {
  const { id, name, notes, snapshot, overwrite } = args

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // ------------------------------------------------------------
  // OVERWRITE (explicit ID — THIS IS THE KEY FIX)
  // ------------------------------------------------------------
  if (overwrite && id) {
    const { error } = await supabase
      .from("backtests")
      .update({
        name,
        notes,
        snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) throw error

    return { ok: true, mode: "UPDATED", id }
  }

  // ------------------------------------------------------------
  // DUPLICATE NAME CHECK (save-as-new only)
  // ------------------------------------------------------------
  const { data: existing } = await supabase
    .from("backtests")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", name)
    .maybeSingle()

  if (existing) {
    return { ok: false, reason: "DUPLICATE" }
  }

  // ------------------------------------------------------------
  // INSERT NEW
  // ------------------------------------------------------------
  const { data, error } = await supabase
    .from("backtests")
    .insert({
      user_id: user.id,
      name,
      notes,
      snapshot,
    })
    .select("id")
    .single()

  if (error || !data) throw error

  return { ok: true, mode: "INSERTED", id: data.id }
}


// -----------------------------------------------------------------------------
// Snapshot builder (USED BY BACKTESTER PAGE — REQUIRED)
// -----------------------------------------------------------------------------

export function buildSnapshotV1(args: {
  config: any
  trades: any[]
}) {
  return {
    version: 1 as const,
    config: args.config,
    trades: args.trades,
    createdAt: Date.now(),
  }
}
