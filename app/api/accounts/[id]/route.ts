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
  // 🔑 THIS IS THE FIX
  const { id } = await ctx.params

  console.log("🗑️ DELETE ACCOUNT:", id)

  if (!id) {
    return NextResponse.json(
      { error: "Missing account id" },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from("trading_accounts")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("❌ DELETE FAILED:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  console.log("✅ ACCOUNT DELETED:", id)

  return NextResponse.json({ success: true })
}
