// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import Stripe from 'https://esm.sh/stripe@12.0.0'

declare const Deno: any;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req: Request) => {
  const signature = req.headers.get('Stripe-Signature')

  // 1. Vérifier que la requête vient bien de Stripe (Sécurité)
  const body = await req.text()
  let event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // 2. Traiter l'événement "Checkout Completed"
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    // On utilise prefilled_email ou customer_details
    const customerEmail = session.customer_details?.email || session.customer_email

    // Déduction du plan selon le montant (en centimes)
    // 49.00 DH = 4900
    // 199.00 DH = 19900
    let newPlan = 'FREE'
    if (session.amount_total === 4900) newPlan = 'STUDENT_PRO'
    if (session.amount_total === 19900) newPlan = 'TEACHER_PRO'

    if (customerEmail && newPlan !== 'FREE') {
      // 3. Mettre à jour Supabase
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Trouver l'utilisateur par email dans la table profiles
      // Note: On suppose que l'email est stocké dans profiles. 
      // Sinon, il faudrait faire une jointure complexe ou stocker l'email à l'inscription.
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
            plan: newPlan,
            // Si prof, crédits illimités (999), sinon 50
            daily_credits: newPlan === 'TEACHER_PRO' ? 999 : 50,
            last_refill_date: new Date().toISOString()
        })
        .eq('email', customerEmail)

      if (error) {
          console.error('Erreur Update Supabase:', error)
          return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      } else {
          console.log(`Succès: Compte ${customerEmail} passé en ${newPlan}`)
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})