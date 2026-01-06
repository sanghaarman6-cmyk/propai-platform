import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { stripe } from "@/lib/stripe/server"

export async function GET() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ invoices: [] })
  }

  const invoices = await stripe.invoices.list({
    customer: profile.stripe_customer_id,
    limit: 20,
  })

  const mapped = invoices.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    currency: inv.currency,
    amount_due: inv.amount_due,
    amount_paid: inv.amount_paid,
    created: inv.created,
    hosted_invoice_url: inv.hosted_invoice_url,
    invoice_pdf: inv.invoice_pdf,
  }))

  return NextResponse.json({ invoices: mapped })
}
