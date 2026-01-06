import { FIRM_TEMPLATES } from "./firmTemplates"

export function detectPropFirm(
  accountName?: string,
  server?: string
): string {
  const text = `${accountName ?? ""} ${server ?? ""}`.toLowerCase()

  // 🔥 ALPHA CAPITAL (ACG)
  if (
    text.includes("alpha") ||
    text.includes("acg") ||
    text.includes("acgmarkets")
  ) {
    return "alpha capital"
  }

  if (text.includes("ftmo")) return "ftmo"
  if (text.includes("mff") || text.includes("myforexfunds"))
    return "my forex funds"

  return "unknown"
}
