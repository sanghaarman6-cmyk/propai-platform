import { FIRM_TEMPLATES } from "./firmTemplates"

export function detectPropFirm(accountName: string, server: string) {
  const text = `${accountName} ${server}`.toLowerCase()

  if (text.includes("ftmo")) return "FTMO"
  if (text.includes("alpha")) return "Alpha Capital Group"
  if (text.includes("mff") || text.includes("myforexfunds"))
    return "MyForexFunds"

  return "Unknown"
}
