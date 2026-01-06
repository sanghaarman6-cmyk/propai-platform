import type { PropFirmDefinition, Ruleset } from "./types"

import { ALPHA_CAPITAL } from "./alpha-capital"
// (Add these as you build them)
// import { FTMO } from "./ftmo"
// import { FUNDING_PIPS } from "./funding-pips"
// import { FUNDED_NEXT } from "./funded-next"

export const PROP_FIRM_DEFINITIONS: PropFirmDefinition[] = [
  ALPHA_CAPITAL,
  // FTMO,
  // FUNDING_PIPS,
  // FUNDED_NEXT,
]

function flatten(defs: PropFirmDefinition[]): Ruleset[] {
  return defs.flatMap((firm) =>
    (firm.programs ?? []).flatMap((p) =>
      (p.phases ?? []).flatMap((ph) =>
        (ph.accountSizes ?? []).map((a) => ({
          firmKey: firm.firmKey,
          firmName: firm.firmName,
          program: p.program,
          phase: ph.phase,
          accountSize: a.accountSize,
          profitTargetPct: a.profitTargetPct,
          drawdown: a.drawdown,
          rules: a.rules,
        }))
      )
    )
  )
}

// ✅ Flat list used by wizard + backend confirm endpoint
export const PROP_FIRM_RULESETS: Ruleset[] = flatten(PROP_FIRM_DEFINITIONS)

// ✅ Resolver used by wizard + backend
export function resolveRuleset(input: {
  firmKey: string
  program: string
  phase: string
  accountSize: number
}) {
  return PROP_FIRM_RULESETS.find(
    (r) =>
      r.firmKey === input.firmKey &&
      r.program === input.program &&
      r.phase === input.phase &&
      r.accountSize === input.accountSize
  )
}
