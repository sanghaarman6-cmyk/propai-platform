import { PropFirmTemplate } from "./types"

export const FTMO: PropFirmTemplate = {
  firmKey: "ftmo",
  firmName: "FTMO",

  programs: [
    {
      key: "ftmo_standard",
      label: "FTMO Challenge",
      leverage: "1:100",
      platform: ["MT5", "cTrader"],
      accountSizes: [10000, 25000, 50000, 100000, 200000],

      phases: [
        {
          phase: "Phase 1",
          profitTarget: { percent: 10 },
          drawdown: {
            max: { percent: 10, basis: "balance", model: "static" },
            daily: { percent: 5, basis: "equity", model: "static" },
          },
          minTradingDays: 4,
          newsTradingAllowed: true,
          weekendHoldingAllowed: false,
        },
        {
          phase: "Phase 2",
          profitTarget: { percent: 5 },
          drawdown: {
            max: { percent: 10, basis: "balance", model: "static" },
            daily: { percent: 5, basis: "equity", model: "static" },
          },
          minTradingDays: 4,
        },
        {
          phase: "Funded",
          drawdown: {
            max: { percent: 10, basis: "balance", model: "static" },
            daily: { percent: 5, basis: "equity", model: "static" },
          },
        },
      ],
    },
  ],
}
