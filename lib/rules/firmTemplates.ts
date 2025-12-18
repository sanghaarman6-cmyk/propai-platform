export type PropFirmRules = {
  name: string
  profitTargetPct: number
  dailyDrawdownPct: number
  maxDrawdownPct: number
  phases: ("Phase 1" | "Phase 2" | "Funded")[]
}

export const FIRM_TEMPLATES: PropFirmRules[] = [
  {
    name: "FTMO",
    profitTargetPct: 10,
    dailyDrawdownPct: 5,
    maxDrawdownPct: 10,
    phases: ["Phase 1", "Phase 2", "Funded"],
  },
  {
    name: "Alpha Capital Group",
    profitTargetPct: 8,
    dailyDrawdownPct: 5,
    maxDrawdownPct: 10,
    phases: ["Phase 1", "Funded"],
  },
  {
    name: "MyForexFunds",
    profitTargetPct: 8,
    dailyDrawdownPct: 5,
    maxDrawdownPct: 12,
    phases: ["Phase 1", "Phase 2", "Funded"],
  },
]
