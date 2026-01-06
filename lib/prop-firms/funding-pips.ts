import { PropFirmTemplate } from "./types"

export const FUNDING_PIPS: PropFirmTemplate = {
  firmKey: "funding_pips",
  firmName: "FundingPips",

  programs: [
    {
      key: "stellar_2_step",
      label: "Stellar 2-Step",
      leverage: "1:100",
      platform: ["MT5"],
      accountSizes: [5000, 10000, 25000, 50000, 100000, 200000],

      phases: [
        {
          phase: "Phase 1",
          profitTarget: { percent: 8 },
          drawdown: {
            max: { percent: 10, basis: "balance", model: "static" },
            daily: { percent: 5, basis: "balance", model: "static" },
          },
          minTradingDays: 5,
        },
        {
          phase: "Phase 2",
          profitTarget: { percent: 5 },
          drawdown: {
            max: { percent: 10, basis: "balance", model: "static" },
            daily: { percent: 5, basis: "balance", model: "static" },
          },
        },
        {
          phase: "Funded",
          drawdown: {
            max: { percent: 10, basis: "balance", model: "static" },
            daily: { percent: 5, basis: "balance", model: "static" },
          },
        },
      ],
    },

    {
      key: "stellar_instant",
      label: "Stellar Instant",
      leverage: "1:50",
      platform: ["MT5"],
      accountSizes: [5000, 10000, 25000, 50000],

      phases: [
        {
          phase: "Funded",
          drawdown: {
            max: { percent: 6, basis: "balance", model: "trailing" },
            daily: { percent: 3, basis: "balance", model: "static" },
          },
          minTradingDays: 7,
        },
      ],
    },
  ],
}
