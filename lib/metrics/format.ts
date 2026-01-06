export function fmt2(x: number | null | undefined) {
  if (x == null || !Number.isFinite(x)) return "—"
  return x.toFixed(2)
}

export function fmtPct(x: number | null | undefined) {
  if (x == null || !Number.isFinite(x)) return "—"
  return `${(x * 100).toFixed(2)}%`
}

export function fmtMoney(x: number | null | undefined, currency = "$") {
  if (x == null || !Number.isFinite(x)) return "—"
  const sign = x < 0 ? "-" : ""
  const abs = Math.abs(x)
  return `${sign}${currency}${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}
