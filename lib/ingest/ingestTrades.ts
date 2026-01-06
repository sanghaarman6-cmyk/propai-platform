import { supabaseAdmin } from "@/lib/supabase/admin"

export type NormalizedTrade = {
  user_id: string
  account_id: string
  platform: string
  platform_trade_id: string
  symbol: string
  side: "long" | "short"
  pnl: number
  quantity?: number
  entry_price?: number
  exit_price?: number
  opened_at?: string | null
  closed_at: string
  raw: any
}

export async function ingestTrades(trades: NormalizedTrade[]) {
  if (!trades.length) return

  const { error } = await supabaseAdmin
    .from("trades")
    .upsert(trades, {
      onConflict: "account_id,platform,platform_trade_id",
    })

  if (error) {
    console.error("Trade ingestion failed:", error)
    throw error
  }
}
