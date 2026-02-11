
import { loadStripe } from '@stripe/stripe-js';
import { from } from '../database/query-builder';

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

  // --- MODE SQLITE : Activation directe dans la base locale ---
  // Note: Stripe Edge Functions are not available in SQLite mode
  // For production, implement a backend API endpoint for Stripe
  
  console.log("Mode SQLite détecté. Activation directe du plan.");

  if (userId) {
      const role = plan.startsWith('TEACHER') ? 'TEACHER' : 'STUDENT';
      const subscriptionEndDate = plan === 'STUDENT_PASS_24H' 
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
          : null;

      try {
          const { error: updateError } = await from('profiles')
              .eq('id', userId)
              .update({
                  plan: plan,
                  role: role,
                  daily_credits: credits,
                  last_refill_date: new Date().toISOString().split('T')[0],
                  subscription_end_date: subscriptionEndDate
              });

          if (!updateError) {
              alert(`[ACTIVATION RÉUSSIE] 🎉\n\nLe mode ${plan === 'TEACHER_PRO' ? 'Enseignant' : 'Étudiant'} a été activé sur votre compte.`);
              window.location.reload();
              return;
          } else {
              console.error("Erreur mise à jour profil:", updateError);
              activateLocalMode(plan, credits);
          }
      } catch (err: any) {
          console.error("Exception mise à jour profil:", err.message);
          activateLocalMode(plan, credits);
      }
  } else {
      // Pas de userId, activation locale uniquement
      activateLocalMode(plan, credits);
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
