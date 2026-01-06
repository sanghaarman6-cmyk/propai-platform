import { PropFirmTemplate } from "./types"

export const FUNDED_NEXT: PropFirmTemplate = {
  firmKey: "funded_next",
  firmName: "FundedNext",

  programs: [
    {
      key: "evaluation_2_step",
      label: "Evaluation 2-Step",
      leverage: "1:100",
      platform: ["MT5"],
      accountSizes: [6000, 15000, 25000, 50000, 100000, 200000],

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
  ],
}
