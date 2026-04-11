import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import Stripe from "stripe"

export async function GET() {
  console.log("👀 GET webhook check")
  return new Response("OK", { status: 200 })
}

export async function POST(req: Request) {
  console.log("🔥 WEBHOOK HIT")

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  console.log("📦 EVENT:", event.type)

  switch (event.type) {
    // ✅ CHECKOUT COMPLETED (unlock immediately)
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session

      const userId =
        session.metadata?.user_id || session.client_reference_id

      if (!userId) {
        console.log("❌ No userId in checkout session")
        break
      }

      console.log("✅ Checkout completed for:", userId)

      await supabaseAdmin
        .from("profiles")
        .update({
          stripe_customer_id: session.customer as string,
          subscription_status: "trialing", // 🔥 KEY FIX
          trial_used: true,
        })
        .eq("id", userId)

      break
    }

    // ✅ SUBSCRIPTION CREATED / UPDATED
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as any

      const userId = sub.metadata?.user_id

      if (!userId) {
        console.log("❌ Missing user_id in metadata")
        break
      }

      console.log("✅ Updating subscription for:", userId)

      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: sub.status, // trialing / active
          plan: sub.items?.data?.[0]?.price?.id ?? null,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
          trial_end: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null,
          stripe_customer_id: sub.customer,
        })
        .eq("id", userId)

      break
    }

    // ✅ PAYMENT SUCCESS (final confirmation)
    case "invoice.paid": {
      const invoice = event.data.object as any

      console.log("💰 Invoice paid for:", invoice.customer)

      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "active",
        })
        .eq("stripe_customer_id", invoice.customer)

      break
    }

    // ❌ SUB CANCELLED
    case "customer.subscription.deleted": {
      const sub = event.data.object as any

      console.log("❌ Subscription cancelled:", sub.customer)

      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "inactive",
          plan: null,
          current_period_end: null,
          trial_end: null,
        })
        .eq("stripe_customer_id", sub.customer)

      break
    }
  }

  return NextResponse.json({ received: true })
}