// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@12.0.0'

declare const Deno: any;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { priceId, email, plan } = await req.json()

    // Création de la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Doit correspondre à un ID de prix valide dans Stripe
          quantity: 1,
        },
      ],
      mode: 'subscription', // ou 'payment' pour un achat unique
      success_url: `${req.headers.get('origin')}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/`,
      customer_email: email,
      metadata: {
        plan: plan,
      },
    })

    return new Response(JSON.stringify({ id: session.id, url: session.url }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})