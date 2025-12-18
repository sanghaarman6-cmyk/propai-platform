import type { RuleTemplate } from "../accountHubStore"

const TEMPLATES: RuleTemplate[] = [
  {
    id: "ftmo",
    firmName: "FTMO",
    profitTargetPct: 10,
    dailyLossPct: 5,
    maxLossPct: 10,
    minDays: 4,
    timeLimitDays: 30,
  },
  {
    id: "alpha",
    firmName: "Alpha Capital Group",
    profitTargetPct: 10,
    dailyLossPct: 5,
    maxLossPct: 10,
    minDays: 4,
    timeLimitDays: 30,
  },
  {
    id: "generic",
    firmName: "Generic Prop",
    profitTargetPct: 8,
    dailyLossPct: 4,
    maxLossPct: 8,
  },
]

export function detectFirmAndTemplate(account: any): {
  firmName: string
  template: RuleTemplate
} {
  const name = String(account?.name ?? "").toLowerCase()
  const server = String(account?.server ?? "").toLowerCase()

  if (name.includes("ftmo") || server.includes("ftmo")) {
    return { firmName: "FTMO", template: TEMPLATES.find((t) => t.id === "ftmo")! }
  }

  if (name.includes("alpha") || name.includes("acg") || server.includes("acg")) {
    return { firmName: "Alpha Capital Group", template: TEMPLATES.find((t) => t.id === "alpha")! }
  }

  return { firmName: "Generic Prop", template: TEMPLATES.find((t) => t.id === "generic")! }
}
