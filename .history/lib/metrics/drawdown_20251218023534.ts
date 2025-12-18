export function calculateDrawdown(balance: number, equity: number) {
  const ddUsd = balance - equity
  const ddPct = balance > 0 ? (ddUsd / balance) * 100 : 0

  return {
    ddUsd,
    ddPct: Math.max(0, ddPct),
  }
}
