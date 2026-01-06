export type FirmTemplate = {
  name: string
  evaluation?: string[]
  funded?: string[]
}

export const FIRM_TEMPLATES: FirmTemplate[] = [
  {
    name: "FTMO",
    evaluation: [
      "Max daily loss 5%",
      "Max total loss 10%",
    ],
    funded: [
      "Max loss 10%",
      "No daily loss limit",
    ],
  },
]
