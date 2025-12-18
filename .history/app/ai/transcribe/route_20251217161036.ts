import OpenAI from "openai"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 })
    }

    const result = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
    })

    return NextResponse.json({ text: result.text })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    )
  }
}
