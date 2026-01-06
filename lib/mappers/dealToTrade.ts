import { buildTrade } from "./buildTrade"

export function dealToTrade(d: any, baselineBalance?: number) {
  return buildTrade({
    id: d.id,
    tsISO: new Date(d.time * 1000).toISOString(),
    instrument: d.symbol,
    direction: d.direction,
    entry: d.price,
    exit: d.price,
    profit: d.profit,
    volume: d.volume ?? 0,
    baselineBalance,
  })
}
