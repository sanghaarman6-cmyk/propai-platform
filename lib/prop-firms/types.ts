export type DrawdownModel =
  | "static_balance"
  | "static_equity"
  | "trailing_balance"
  | "trailing_equity"

export type DrawdownRule = {
  percent: number
  model: DrawdownModel
}

export type Ruleset = {
  firmKey: string
  firmName: string

  program: string
  phase: string
  accountSize: number

  profitTargetPct: number

  drawdown: {
    daily?: DrawdownRule
    max: DrawdownRule
  }

  rules: {
    minTradingDays?: number
    maxTradingDays?: number
    weekendHoldingAllowed?: boolean
    newsTradingAllowed?: boolean
    eaAllowed?: boolean
  }
}

/**
 * Human-readable definition (nested)
 */
export type PropFirmDefinition = {
  firmKey: string
  firmName: string
  programs: {
    program: string
    phases: {
      phase: string
      accountSizes: {
        accountSize: number
        profitTargetPct: number
        drawdown: Ruleset["drawdown"]
        rules: Ruleset["rules"]
      }[]
    }[]
  }[]
}
