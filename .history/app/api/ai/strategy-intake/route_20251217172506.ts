console.log("OPENAI KEY EXISTS:", !!process.env.OPENAI_API_KEY)


import OpenAI from "openai"
import { NextResponse } from "next/server"
import { StrategyProfileSchema } from "@/lib/strategySchema"

export const runtime = "nodejs"

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text: string }

    if (!text || text.trim().length < 30) {
      return NextResponse.json(
        { error: "Please provide a detailed strategy description (30+ chars)." },
        { status: 400 }
      )
    }

    // We use Structured Outputs to force schema adherence
    const response = await client.responses.create(
        {
            model: "gpt-4.1",
            input: [
            {
                role: "system",
                content:
                "You are an elite prop-firm trading coach. Extract a trader's strategy into a structured internal profile. Be conservative. Never invent rules. If unsure, list uncertainty explicitly.",
            },
            {
                role: "user",
                content: `Trader strategy description:\n\n${text}`,
            },
            ],
            text: {
            format: {
                type: "json_schema",
                json_schema: {
                name: "strategy_profile",
                schema: StrategyProfileSchema.toJSONSchema(),
                },
            },
            },
        } as any
        )




    const output = response.output_text
    const profile = JSON.parse(output)

    return NextResponse.json({ profile })


    return NextResponse.json({ profile: validated })
  } catch (err: any) {
    console.error("STRATEGY INTAKE ERROR:", err)
    return NextResponse.json(
      { error: err?.message ?? "AI failure" },
      { status: 500 }
    )
  }
}
