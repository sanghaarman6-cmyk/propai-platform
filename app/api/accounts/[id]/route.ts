import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  console.log("🗑️ DELETE ACCOUNT:", id)

  if (!id) {
    return NextResponse.json({ error: "Missing account id" }, { status: 400 })
  }

  const { error } = await supabase.from("trading_accounts").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  if (!id) {
    return NextResponse.json({ error: "Missing account id" }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const label = typeof body.label === "string" ? body.label.trim() : null

  const { data, error } = await supabase
    .from("trading_accounts")
    .update({ label: label && label.length ? label : null })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
