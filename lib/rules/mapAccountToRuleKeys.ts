export type RuleKeys = {
  firm_key: string
  phase: string
  program: string
}

/**
 * Converts trading_accounts display values
 * into stable rule keys used by firm_rules_structured
 */
export function mapAccountToRuleKeys(account: any): RuleKeys {
  // ---------- FIRM ----------
  const firm_key_map: Record<string, string> = {
    "alpha capital": "alpha_capital",
    "alpha capital group": "alpha_capital",
  }

  // ---------- PHASE ----------
  const phase_map: Record<string, string> = {
    "phase 1": "phase_1",
    "phase 2": "phase_2",
    "funded": "funded",
  }

  // ---------- PROGRAM ----------
  const program_map: Record<string, string> = {
    "alpha pro – 8% / 4%": "alpha_pro_8_4",
    "alpha pro 8% / 4%": "alpha_pro_8_4",
    "alpha pro 8/4": "alpha_pro_8_4",
    "default": "default",
  }

  const firm_raw = account.firm_detected?.toLowerCase().trim()
  const phase_raw = account.phase?.toLowerCase().trim()
  const program_raw = account.program?.toLowerCase().trim()

  const firm_key = firm_key_map[firm_raw]
  const phase = phase_map[phase_raw]
  const program = program_map[program_raw] ?? "default"

  if (!firm_key || !phase) {
    throw new Error(
      `Unmapped rule keys: firm='${firm_raw}', phase='${phase_raw}', program='${program_raw}'`
    )
  }

  return { firm_key, phase, program }
}
