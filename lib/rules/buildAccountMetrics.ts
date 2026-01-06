export async function buildAccountMetrics(
  supabase: any,
  args: { userId: string; accountId: string; account: any }
) {
  const balance = Number(args.account.balance ?? 0)
  const equity = Number(args.account.equity ?? balance)

  // TEMP placeholders until we compute from history.
  return {
    balance,
    equity,
    peakEquity: equity,
    startOfDayEquity: equity,
    bestDayProfitPct: 31,
    avgTradeDurationSec: 180,
  }
}
