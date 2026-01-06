import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
import type { BacktestSnapshotV1 } from "@/lib/types/backtests"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function saveBacktest(args: {
  name: string
  notes: string | null
  snapshot: BacktestSnapshotV1
  overwrite?: boolean
}) {
  const { name, notes, snapshot, overwrite } = args

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from("backtests")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", name)
    .maybeSingle()

  if (existing && !overwrite) {
    return { ok: false as const, reason: "DUPLICATE" as const }
  }

  // UPDATE
  if (existing && overwrite) {
    const { error } = await supabase
      .from("backtests")
      .update({
        snapshot,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)

    if (error) throw error

    return { ok: true as const, mode: "UPDATED" as const }
  }

  // INSERT
  const { error } = await supabase.from("backtests").insert({
    user_id: user.id,
    name,
    notes,
    snapshot,
  })

  if (error) throw error

  return { ok: true as const, mode: "INSERTED" as const }
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
