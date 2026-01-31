
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

// Remplacez par votre clé publique Stripe (commence par pk_live_ ou pk_test_)
const STRIPE_PUBLIC_KEY = 'pk_test_votre_cle_publique_ici';

let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

export const redirectToCheckout = async (plan: 'TEACHER_PRO' | 'STUDENT_PASS_24H' | 'STUDENT_PACK_BAC', userEmail: string, userId?: string) => {
  const credits = plan === 'TEACHER_PRO' ? 999 : plan === 'STUDENT_PASS_24H' ? 100 : 999; // STUDENT_PACK_BAC gets unlimited

  // --- 1. MODE LOCAL / HORS LIGNE (Prioritaire si Supabase mal configuré) ---
  if (!supabase) {
      console.log("Mode Local détecté. Activation simulation.");
      activateLocalMode(plan, credits);
      return;
  }

  // --- 2. MODE CONNECTÉ (Avec Supabase) ---
  const PRICE_IDS = {
    TEACHER_PRO: 'price_TEACHER_PRO_ID',
    STUDENT_PASS_24H: 'price_STUDENT_PASS_24H_ID',
    STUDENT_PACK_BAC: 'price_STUDENT_PACK_BAC_ID'
  };
  const priceId = PRICE_IDS[plan];

  try {
    // A. Tentative d'appel à la Edge Function Stripe
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId, email: userEmail, plan }
    });

    if (error) throw error; // Lève une exception si la fonction n'existe pas ou échoue

    if (data?.url) {
        window.location.href = data.url;
    } else if (data?.id) {
        const stripe = await getStripe();
        await stripe.redirectToCheckout({ sessionId: data.id });
    }
  } catch (err: any) {
    console.warn("Le service de paiement est indisponible (Mode Simulation activé):", err.message);

    // B. FALLBACK : ACTIVATION DIRECTE DB (Simulation)
    // Puisque le paiement échoue (pas de backend), on active le plan directement dans la base.
    if (userId) {
        const role = plan.startsWith('TEACHER') ? 'TEACHER' : 'STUDENT';
        const subscriptionEndDate = plan === 'STUDENT_PASS_24H' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                plan: plan,
                role: role,
                daily_credits: credits,
                last_refill_date: new Date().toISOString().split('T')[0],
                subscription_end_date: subscriptionEndDate
            })
            .eq('id', userId);
        
        if (!updateError) {
            alert(`[ACTIVATION RÉUSSIE] 🎉\n\nLe mode ${plan === 'TEACHER_PRO' ? 'Enseignant' : 'Étudiant'} a été activé gratuitement sur votre compte.`);
            window.location.reload();
            return;
        } else {
            console.error("Erreur DB:", updateError);
            // C. ULTIME RECOURS : ACTIVATION LOCALE (Si DB bloquée)
            alert(`[MODE LOCAL] Activation temporaire.\n\nImpossible de joindre le serveur, mais votre accès ${plan} est activé sur cet appareil.`);
            activateLocalMode(plan, credits);
        }
    } else {
        // Cas rare : Supabase actif mais pas de userId passé
        activateLocalMode(plan, credits);
    }
  }
};

// Helper pour forcer le mode localement
const activateLocalMode = (plan: string, credits: number) => {
    const role = plan.startsWith('TEACHER') ? 'TEACHER' : 'STUDENT';
    const subscriptionEndDate = plan === 'STUDENT_PASS_24H' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

    const currentUserState = localStorage.getItem('profi_user');
    const newState = currentUserState
      ? { ...JSON.parse(currentUserState), plan, role, dailyCredits: credits, maxDailyCredits: credits, subscriptionEndDate }
      : { plan, role, dailyCredits: credits, maxDailyCredits: credits, lastRefillDate: new Date().toDateString(), subscriptionEndDate };

    localStorage.setItem('profi_user', JSON.stringify(newState));
    window.location.reload();
};
