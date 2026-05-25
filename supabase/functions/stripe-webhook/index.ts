import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

// 1. Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()
  
  let event;

  // 2. Security: Verify the request comes from Stripe
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') as string
    )
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // 3. Logic: Process successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    
    // We pass the Supabase User-ID when creating the Stripe-Session as client_reference_id
    const userId = session.client_reference_id; 
    
    // amount_total is in cents (e.g. 1000 = 10.00 EUR)
    const amountPaidCents = session.amount_total; 
    
    // Exchange rate: 10 EUR (1000 Cents) = 100 Flow Credits
    // So 1 EUR = 10 FC -> 1 Cent = 0.1 FC => amountPaidCents / 10
    const flowCreditsToMint = amountPaidCents / 10; 

    if (userId) {
      // 4. Initialize Supabase Admin-Client (bypasses RLS to update wallet)
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // 5. Mint Flow Credits via our SQL RPC function
      const { error } = await supabaseAdmin.rpc('increment_wallet_fc', {
        u_id: userId,
        amount: flowCreditsToMint
      });

      if (error) {
        console.error("Error minting Flow Credits:", error);
        return new Response("Database Error", { status: 500 });
      }

      console.log(`Success! Minted ${flowCreditsToMint} FC for User ${userId}.`);
    }
  }

  // Acknowledge receipt
  return new Response(JSON.stringify({ received: true }), { 
    headers: { 'Content-Type': 'application/json' },
    status: 200 
  })
})
