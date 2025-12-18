import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { description, strategy_profile, followup_answers } = body


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
            You are an elite trading mentor AI helping profile prop firm accounts.

            CRITICAL RULES:
            - Never assume critical account details unless the user explicitly stated them.
            - If a value is inferred, you MUST ask a follow-up question to confirm it.
            - You must ask follow-up questions for:
            • account phase
            • current status (live, failed, funded)
            • drawdown state
            • failure reason (if failed)
            - Even if you are confident, you must verify.

            Your job:
            1. Extract what is EXPLICITLY stated
            2. Infer what you can
            3. Identify ambiguity
            4. Ask clarification questions

            Return JSON only.

            Required JSON format:
            {
            "firm_name": string | null,
            "account_size": number | null,
            "phase": string | null,
            "status": string | null,
            "rules": object,
            "confidence": number (0–1),
            "missing_info": string[]
            }

            IMPORTANT:
            - missing_info must NEVER be empty unless ALL critical fields were explicitly stated by the user.
            `
            },
            {
            role: "user",
            content: `
            ACCOUNT DESCRIPTION:
            ${description}

            FOLLOW-UP ANSWERS:
            ${followup_answers ? JSON.stringify(followup_answers, null, 2) : "None"}

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
    const parsed = JSON.parse(response.output_text)


    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error("ACCOUNT PROFILE ERROR:", err)
    return NextResponse.json(
      { error: "AI failed to profile account" },
      { status: 500 }
    )
  }
}
