
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { CycleType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'LOGIN' | 'REGISTER';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'LOGIN' }) => {
  const [isLogin, setIsLogin] = useState(initialView === 'LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cycle, setCycle] = useState<CycleType>('LYCEE');
  const [schoolName, setSchoolName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setMessage(null);
      setLoading(false);
      setShowResend(false);
      setPassword('');
      setIsLogin(initialView === 'LOGIN');
    }
  }, [isOpen, initialView]);

  // Fonction pour activer le mode démo local si l'email ne passe pas
  const handleDemoAccess = () => {
      // On sauvegarde l'email saisi pour personnaliser la session démo
      const demoEmail = email.trim() || 'utilisateur@local.ma';
      localStorage.setItem('profi_demo_email', demoEmail);

      if (confirm(`⚠️ ACTIVER LE MODE SECOURS ?\n\nSi vous ne recevez pas l'email de confirmation, nous pouvons activer votre compte localement sur cet appareil.\n\nCela vous donnera un accès immédiat "Teacher Pro" pour tester l'application.\n\nContinuer ?`)) {
          // Création d'une session locale simulée
          localStorage.setItem('profi_demo_session', 'true');
          
          // Simulation du profil Teacher Pro avec les données saisies
          const demoProfile = { 
              plan: 'TEACHER_PRO', 
              dailyCredits: 999, 
              maxDailyCredits: 999, 
              lastRefillDate: new Date().toDateString(),
              preferredCycle: cycle,
              schoolName: schoolName || 'Lycée Local'
          };
          localStorage.setItem('profi_user', JSON.stringify(demoProfile));
          
          alert(`✅ Compte de secours activé pour ${demoEmail} !`);
          window.location.reload();
      }
  };

  // Fonction pour renvoyer l'email de confirmation manuellement
  const handleResendEmail = async () => {
      if (!email) return;
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
          const { error } = await supabase!.auth.resend({
              type: 'signup',
              email: email.trim(),
              options: {
                  emailRedirectTo: window.location.origin
              }
          });

          if (error) throw error;
          setMessage("📧 Nouvel email envoyé !");
          // On reste sur l'écran de renvoi
      } catch (err: any) {
          console.error("Resend Error:", err);
          if (err.message?.includes("Too many requests") || err.status === 429) {
              setError("Trop de tentatives. Attendez 60 secondes.");
          } else {
              setError("Erreur d'envoi. Essayez le bouton 'Accès Immédiat'.");
          }
      } finally {
          setLoading(false);
      }
  };

  const translateError = (errorMsg: string, status?: number): string => {
    if (errorMsg.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
    if (errorMsg.includes("Email not confirmed")) return "Compte non activé.";
    if (errorMsg.includes("User already registered")) return "Cet email est déjà utilisé.";
    if (errorMsg.includes("Password should be at least")) return "Le mot de passe est trop court.";
    if (errorMsg.includes("Rate limit exceeded") || errorMsg.includes("Too many requests") || status === 429) {
      return "⏳ Trop de tentatives. Attendez 60 secondes ou utilisez le mode 'Accès Immédiat' ci-dessous.";
    }
    return "Une erreur est survenue.";
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setShowResend(false);

    const cleanEmail = email.trim();

    if (!supabase) {
        // Mode hors ligne/sans backend -> On propose directement le mode secours
        handleDemoAccess();
        setLoading(false);
        return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { preferred_cycle: cycle, school_name: schoolName }
          }
        });
        if (error) throw error;

        // Si l'inscription réussit mais que session est null, c'est que l'email confirmation est requis
        if (data.user && !data.session) {
            setMessage("Compte créé ! Vérifiez vos emails.");
            setShowResend(true); 
        } else {
            onClose(); 
        }
      }
    } catch (err: any) {
      const msg = err.message || "";
      const status = err.status;
      setError(translateError(msg, status));
      
      // Si l'erreur indique que l'email n'est pas confirmé, existe déjà, ou trop de tentatives, on propose de renvoyer ou le mode secours
      if (msg.includes("Email not confirmed") || msg.includes("User already registered") || err.status === 429) {
          setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 text-lg">{isLogin ? 'Connexion Profi' : 'Créer un compte'}</h3>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
        </div>
        
        <div className="p-6">
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}
            
            {message && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-start gap-2">
                     <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{message}</span>
                </div>
            )}

            {/* Zone CRITIQUE : Résolution problème email */}
            {showResend && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl text-center shadow-inner animate-pulse-slow">
                    <h4 className="text-orange-800 font-black text-sm mb-2 uppercase tracking-wide">📧 Email non reçu ?</h4>
                    <p className="text-xs text-orange-700 mb-4 font-medium leading-relaxed">
                        Les serveurs d'envoi peuvent être lents. Ne restez pas bloqué !
                    </p>
                    
                    <button 
                        type="button"
                        onClick={handleDemoAccess}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        ACCÉDER SANS EMAIL
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={handleResendEmail}
                        disabled={loading}
                        className="text-[10px] text-orange-600 underline mt-3 hover:text-orange-800"
                    >
                        {loading ? 'Envoi...' : 'Renvoyer le lien (Patienter)'}
                    </button>
                </div>
            )}

            {!showResend && (
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white"
                        placeholder="email@exemple.ma"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mot de passe</label>
                        <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white"
                        placeholder={isLogin ? "••••••••" : "8+ car., Maj, Chiffre"}
                        />
                    </div>

                    {!isLogin && (
                        <div className="animate-fade-in space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Niveau scolaire</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['PRIMAIRE', 'COLLEGE', 'LYCEE'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setCycle(c as CycleType)}
                                            className={`py-2 rounded-lg text-[10px] font-bold border ${cycle === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Établissement</label>
                                <input
                                    type="text"
                                    value={schoolName}
                                    onChange={(e) => setSchoolName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white"
                                    placeholder="Lycée..."
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 mt-2"
                    >
                        {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
                    </button>
                </form>
            )}

            {!showResend && (
                <>
                <div className="mt-4 flex items-center gap-4">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs text-slate-400 font-medium">OU</span>
                <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <button 
                    type="button"
                    onClick={handleDemoAccess}
                    className="w-full mt-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                    J'ai un problème technique
                </button>
                </>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
                {isLogin ? "Pas de compte ?" : "Déjà un compte ?"}
                <button 
                    onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); setShowResend(false); }}
                    className="ml-1 text-indigo-600 font-bold hover:text-indigo-800"
                >
                    {isLogin ? "Créer un compte" : "Se connecter"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
