export type FirmKey =
  | "ftmo"
  | "funding_pips"
  | "the_funded_trader"
  | "my_forex_funds"
  | "alpha_capital"
  | "e8"
  | "topstep"
  | "unknown"

export function normalizeFirmKey(input?: string | null): FirmKey {
  const s = (input ?? "").toLowerCase()

  if (s.includes("ftmo")) return "ftmo"
  if (s.includes("funding pips")) return "funding_pips"
  if (s.includes("the funded trader") || s.includes("tft"))
    return "the_funded_trader"
  if (s.includes("my forex funds") || s.includes("mff"))
    return "my_forex_funds"
  if (s.includes("alpha capital")) return "alpha_capital"
  if (s.includes("e8")) return "e8"
  if (s.includes("topstep")) return "topstep"

  return "unknown"
}
