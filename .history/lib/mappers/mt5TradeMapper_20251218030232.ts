export function mapMT5Trade(t: any) {
  return {
    id: t.ticket.toString(),
    tsISO: new Date(t.time * 1000).toISOString(),
    instrument: t.symbol,
    direction: t.profit >= 0 ? "Long" : "Short",
    entry: t.price_open,
    exit: t.price_close,
    rMultiple: t.profit !== 0 ? t.profit / Math.abs(t.profit) : 0,
    durationMin: 0,
    session: "Unknown",
    setupTag: "MT5",
    outcome: t.profit > 0 ? "Win" : t.profit < 0 ? "Loss" : "BE",
    profit: t.profit,
  }
}
