import { NextResponse } from "next/server"
import { runEdgeBrain } from "@/lib/edge/edgeBrain"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      message?: string
      accountId?: string | null
    }

    const message = (body?.message ?? "").trim()

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Message is required." },
        { status: 400 }
      )
    }

    const result = await runEdgeBrain({
      message,
      accountId: body?.accountId ?? null,
    })

    if (!result.ok) {
      return NextResponse.json(result, { status: 401 })
    }

    // 🔹 INFO MODE → plain text
    if (result.meta?.mode === "info") {
      return NextResponse.json({
        ok: true,
        mode: "info",
        text: result.text,
        meta: result.meta ?? null,
      })
    }

    // 🔹 ANALYSIS MODE → strict blocks
    let blocks: any
    try {
      blocks = JSON.parse(result.text)
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "EDGE AI response was not valid JSON.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      mode: "analysis",
      blocks,
      meta: result.meta ?? null,
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    )
  }
}
