import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { stripe } from "@/lib/stripe/server"

export async function POST() {
  // ✅ cookies() is async in Next 16
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

  // ✅ Auth now works
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id, trial_used")
    .eq("id", user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY!
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  const eligibleForTrial = profile?.trial_used === false

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/app/dashboard?checkout=success`,
    cancel_url: `${siteUrl}/app/dashboard?checkout=cancel`,

    client_reference_id: user.id,

    customer: profile?.stripe_customer_id || undefined,
    customer_email: profile?.stripe_customer_id
      ? undefined
      : user.email ?? undefined,

    subscription_data: {
      ...(eligibleForTrial ? { trial_period_days: 14 } : {}),
      metadata: {
        user_id: user.id,
      },
    },

  })

  return NextResponse.json({ url: session.url })
}
