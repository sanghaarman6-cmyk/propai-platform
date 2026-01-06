// app/api/fundamentals/insight/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { generateInsight } from "@/lib/fundamentals/ai/generate"
import { hashPayload } from "@/lib/fundamentals/ai/utils"

type Kind = "event" | "calendar" | "central_bank"


function computeConfidence(kind: string, payload: any) {
  let score = 40 // base

  // impact
  if (payload?.impact === "Extreme") score += 30
  else if (payload?.impact === "High") score += 22
  else if (payload?.impact === "Medium") score += 12
  else score += 5

  // source strength
  if (kind === "central_bank") score += 15
  if (kind === "calendar") score += 8

  // affected assets
  if (Array.isArray(payload?.assets)) {
    score += Math.min(payload.assets.length * 4, 15)
  }

  return Math.min(95, Math.max(35, score))
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const kind: Kind = body?.kind
    const sourceId: string = body?.sourceId
    const payload: any = body?.payload

    if (!kind || !sourceId || !payload) {
      return NextResponse.json({ error: "Missing kind/sourceId/payload" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    const payloadHash = hashPayload({ kind, sourceId, payload })

    // 1) read cache
    const { data: cached, error: readErr } = await supabase
      .from("fundamentals_ai_insights")
      .select("id, insight, payload_hash, model, version, updated_at")
      .eq("kind", kind)
      .eq("source_id", sourceId)
      .maybeSingle()

    if (!readErr && cached?.insight && cached.payload_hash === payloadHash) {
      return NextResponse.json({
        cached: true,
        insight: cached.insight,
        meta: { model: cached.model, version: cached.version, updated_at: cached.updated_at },
      })
    }

    // 2) generate new
    const { insight: rawInsight, model } = await generateInsight(kind, payload)

    const confidence = computeConfidence(kind, payload)

    const insight = {
      ...rawInsight,
      confidence, // ← OVERRIDE AI CONFIDENCE
    }


    // 3) upsert cache
    const upsertPayload = {
      kind,
      source_id: sourceId,
      payload_hash: payloadHash,
      payload,
      insight,
      model,
      version: 1,
    }

    const { error: upErr } = await supabase
      .from("fundamentals_ai_insights")
      .upsert(upsertPayload, { onConflict: "kind,source_id" })

    if (upErr) {
      // still return insight even if save failed (UX first)
      return NextResponse.json({
        cached: false,
        insight,
        meta: { model, version: 1, saved: false, error: upErr.message },
      })
    }

    return NextResponse.json({
      cached: false,
      insight,
      meta: { model, version: 1, saved: true },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 })
  }
}
