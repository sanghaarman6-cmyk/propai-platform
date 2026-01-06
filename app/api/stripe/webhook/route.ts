import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import Stripe from "stripe"

export async function POST(req: Request) {
    console.log("🔥 WEBHOOK HIT")

  const body = await req.text()

  // ✅ DO NOT use next/headers at all (avoids async typing issue)
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.customer && session.client_reference_id) {
        await supabaseAdmin
          .from("profiles")
          .update({
            stripe_customer_id: session.customer as string,
            trial_used: true,
          })
          .eq("id", session.client_reference_id)
      }
      break
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as any

      // 1️⃣ Try to update by stripe_customer_id
      const { data: updatedByCustomer } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: sub.status,
          plan: sub.items?.data?.[0]?.price?.id ?? null,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
          trial_end: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null,
        })
        .eq("stripe_customer_id", sub.customer)
        .select()

      // 2️⃣ If nothing updated, fall back to client_reference_id
      if (!updatedByCustomer || updatedByCustomer.length === 0) {
        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: sub.status,
            plan: sub.items?.data?.[0]?.price?.id ?? null,
            current_period_end: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
            trial_end: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
          })
          .eq("id", sub.metadata?.user_id ?? "")
      }

      break
    }


    case "customer.subscription.deleted": {
      const sub = event.data.object as any

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
