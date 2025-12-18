import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { description, strategy_profile } = body

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Missing account description" },
        { status: 400 }
      )
    }

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content: `
You are an expert prop-firm trading analyst.

Your job is to analyze a trader's prop account description and infer:
- firm name
- account size
- phase (Phase 1 / Phase 2 / Funded / Unknown)
- status (Active / Failed / Passed / Drawdown Hit / Expired / Unknown)
- known rules (profit target %, daily DD %, max DD %)
- what information is missing and must be asked
- a confidence score (0–1)

DO NOT hallucinate missing facts.
If something cannot be inferred, list it as missing_info.
Return VALID JSON ONLY.
`,
        },
        {
          role: "user",
          content: `
ACCOUNT DESCRIPTION:
${description}

TRADER STRATEGY CONTEXT:
${JSON.stringify(strategy_profile, null, 2)}
`,
        },
      ],
      text: {
        format: {
            type: "json_object",
        },
        },
    })

    const raw = response.output_text
    const parsed = JSON.parse(raw)

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error("ACCOUNT PROFILE ERROR:", err)
    return NextResponse.json(
      { error: "AI failed to profile account" },
      { status: 500 }
    )
  }
}
