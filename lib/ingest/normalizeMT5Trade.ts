import type { NormalizedTrade } from "./ingestTrades"

export function normalizeMT5Trade(
  mt5: any,
  userId: string,
  accountId: string
): NormalizedTrade {
  return {
    user_id: userId,
    account_id: accountId,
    platform: "mt5",
    platform_trade_id: String(mt5.ticket),

    symbol: mt5.symbol,
    side: mt5.type === 0 ? "long" : "short",

    pnl: Number(mt5.profit),
    quantity: Number(mt5.volume),

    entry_price: Number(mt5.price_open),
    exit_price: Number(mt5.price_close),

    opened_at: mt5.time_open
      ? new Date(mt5.time_open * 1000).toISOString()
      : null,

    closed_at: mt5.time_close
      ? new Date(mt5.time_close * 1000).toISOString()
      : new Date(mt5.time * 1000).toISOString(),

    raw: mt5,
  }
}
