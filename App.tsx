
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { SelectionPanel, ConfigPanel, ExamPreview } from './components/wireframes';

import { Footer } from './components/Footer';

import { PricingModal } from './components/PricingModal';

import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import type { Exercise, ExerciseOptions, UserState, PlanType, SystemConfig, ExamEvent, HistoryItem, CycleType } from './types';
import { generateExercises } from './services/geminiService';
import { generateLocalExercises } from './services/localService';
import { defaultConfig, RATE_LIMITS, DEFAULT_AI_MODEL, CURRICULUM, PLAN_FEATURES } from './constants';
import { Loader } from './components/Loader';
import { supabase } from './services/supabaseClient';
import { AuthModal } from './components/AuthModal';
import { generateWordDocument } from './services/wordExportService';
import { ExamPreparation } from './components/ExamPreparation';
import { createAssignment, getAssignmentByCode, submitStudentQuiz } from './services/assignmentService';
import { ToastContainer, ToastMessage } from './components/Toast';
import { getCurriculum } from './services/curriculumService';
import { PlanningModal } from './components/PlanningModal';
import { HistoryView } from './components/HistoryView';
import { getUserHistory, addToHistory, removeFromHistory } from './services/historyService';
import { initializeBrowserModule } from './database/query-builder';

// Helper pour le localStorage
const loadState = <T,>(key: string, fallback: T): T => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
        return fallback;
    }
};

const App: React.FC = () => {
  // --- STATES ---
  const [activeTab, setActiveTab] = useState<'GENERATOR' | 'PREPARATION' | 'HISTORY'>('GENERATOR');
  const [options, setOptions] = useState<ExerciseOptions>(() => loadState('profi_options', defaultConfig));
  const [exercises, setExercises] = useState<Exercise[] | null>(() => loadState('profi_exercises', null));
  const [history, setHistory] = useState<HistoryItem[]>(() => loadState('profi_history', []));
  const [calendarEvents, setCalendarEvents] = useState<ExamEvent[]>(() => loadState('profi_calendar', []));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [assignmentCode, setAssignmentCode] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Modal de planification
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);

  // États pour le mode étudiant (devoir assigné)
  const [isStudentView, setIsStudentView] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [activeDigitalAssignment, setActiveDigitalAssignment] = useState<any>(null);
  const [isAssignmentCompleted, setIsAssignmentCompleted] = useState(false);
  
  // Rate Limiting Ref
  const requestTimestamps = useRef<number[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  
  const [userState, setUserState] = useState<UserState>(() => {
      const initial = loadState<UserState>('profi_user', {
          plan: 'TEACHER_FREE',
          role: 'TEACHER',
          dailyCredits: 3,
          maxDailyCredits: 3,
          lastRefillDate: new Date().toDateString(),
          features: PLAN_FEATURES['TEACHER_FREE']
      });
      const today = new Date().toDateString();
      if (initial.lastRefillDate !== today) {
          return { ...initial, dailyCredits: initial.maxDailyCredits, lastRefillDate: today };
      }
      return initial;
  });

  const [session, setSession] = useState<any>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
      maintenanceMode: false,
      globalAnnouncement: '',
      allowFreeAI: true,
      aiModel: DEFAULT_AI_MODEL,
      curriculumVersion: 'v1.0'
  });

  // --- INIT ---

  useEffect(() => {
    // Initialize browser module first to prevent async loading errors
    initializeBrowserModule().then(() => {
      getCurriculum().then(() => console.log("Curriculum chargé"));
    });

    // 1. Vérification Mode Démo Local (Contournement Email)
    const localDemo = localStorage.getItem('profi_demo_session');
    if (localDemo === 'true') {
        // On essaie de récupérer l'email personnalisé
        const demoEmail = localStorage.getItem('profi_demo_email') || 'professeur@demo.ma';
        
        const demoSession = { 
            user: { 
                id: 'demo-teacher-id', 
                email: demoEmail, 
                email_confirmed_at: new Date().toISOString(),
                user_metadata: { preferred_cycle: 'LYCEE' }
            } 
        };
        setSession(demoSession);
        
        // Force refresh user state from local storage just in case (e.g. customized in AuthModal)
        const storedUser = loadState<UserState>('profi_user', {
            plan: 'TEACHER_PRO',
            role: 'TEACHER',
            dailyCredits: 999,
            maxDailyCredits: 999,
            lastRefillDate: new Date().toDateString(),
            features: PLAN_FEATURES['TEACHER_PRO']
        });
        setUserState(storedUser);
        
        // Si le cycle est stocké, on met à jour les options par défaut
        if (storedUser.preferredCycle) {
            // (Logique simplifiée pour éviter le clignotement, l'utilisateur changera manuellement si besoin)
        }
        return; 
    }

    // 2. Vérification Supabase Standard
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session);
    }).catch(err => {
        console.warn("Erreur de connexion Supabase (getSession):", err);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
         fetchUserProfile(session);
         addToast('success', `Ravi de vous revoir !`);
      } else {
         // Si on perd la session Supabase, on vérifie si on n'est pas en mode démo
         if (!localStorage.getItem('profi_demo_session')) {
             setUserState({ plan: 'TEACHER_FREE', role: 'TEACHER', dailyCredits: 3, maxDailyCredits: 3, lastRefillDate: new Date().toDateString(), features: PLAN_FEATURES['TEACHER_FREE'] });
         }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (session: any) => {
      if (!supabase) return;
      
      // Si c'est le user démo, on skip l'appel DB
      if (session.user.id === 'demo-teacher-id') return;

      const userId = session.user.id;
      
      // 1. Récupération des données Profil (Plan, Crédits)
      const { data: profile, error } = await supabase.from('profiles').select('plan, daily_credits, last_refill_date').eq('id', userId).single();

      if (profile && !error) {
        const maxCredits = profile.plan === 'TEACHER_PRO' ? 999 : (profile.plan === 'STUDENT_PRO' ? 50 : 3);
        const today = new Date().toISOString().split('T')[0];
        let currentCredits = profile.daily_credits;
        
        if (profile.last_refill_date !== today) {
            currentCredits = maxCredits;
            await supabase.from('profiles').update({ daily_credits: maxCredits, last_refill_date: today }).eq('id', userId);
            addToast('info', 'Vos crédits journaliers ont été rechargés.');
        }
        
        // 2. Gestion du Cycle Scolaire Préféré
        const preferredCycle = session.user.user_metadata?.preferred_cycle as CycleType;
        
        if (preferredCycle) {
            let defaultLevel = options.level;
            let defaultSubject = options.subject;
            let defaultChapter = options.chapter;

            // Définition du niveau par défaut en fonction du cycle s'il n'est pas déjà défini
            if (preferredCycle === 'PRIMAIRE' && !options.level.includes('Primaire')) {
                defaultLevel = "Primaire (6ème Année)";
            } else if (preferredCycle === 'COLLEGE' && !options.level.includes('Collège')) {
                defaultLevel = "Collège (3ème Année)";
            } else if (preferredCycle === 'LYCEE' && options.level.includes('Primaire')) { // Si lycéen mais sur un niveau primaire
                defaultLevel = "2ème Année Bac - Sciences Physiques / SVT";
            }

            if (CURRICULUM[defaultLevel]) {
                 if (defaultLevel !== options.level) {
                     const subjects = Object.keys(CURRICULUM[defaultLevel]);
                     defaultSubject = subjects[0];
                     defaultChapter = CURRICULUM[defaultLevel][defaultSubject][0];
                     
                     setOptions(prev => ({
                         ...prev,
                         level: defaultLevel,
                         subject: defaultSubject,
                         chapter: defaultChapter
                     }));
                 }
            }
        }

        const newRole = (profile.plan as string || '').includes('STUDENT') ? 'STUDENT' : 'TEACHER';

        setUserState(prev => ({
            ...prev,
            plan: profile.plan as PlanType,
            role: newRole,
            dailyCredits: currentCredits,
            maxDailyCredits: maxCredits,
            lastRefillDate: today,
            preferredCycle: preferredCycle,
            features: PLAN_FEATURES[profile.plan as PlanType] || PLAN_FEATURES['TEACHER_FREE']
        }));

        // 3. SYNCHRONISATION HISTORIQUE CLOUD
        try {
            const cloudHistory = await getUserHistory(userId);
            if (cloudHistory && cloudHistory.length > 0) {
                setHistory(currentLocal => {
                    const mergedMap = new Map();
                    [...cloudHistory, ...currentLocal].forEach(item => {
                        mergedMap.set(item.id, item);
                    });
                    return Array.from(mergedMap.values())
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 50);
                });
                console.log("Historique synchronisé.");
            }
        } catch (e) {
            console.warn("Sync history failed", e);
        }
      }
  };

  useEffect(() => { localStorage.setItem('profi_options', JSON.stringify(options)); }, [options]);
  useEffect(() => { localStorage.setItem('profi_user', JSON.stringify(userState)); }, [userState]);
  useEffect(() => { if(exercises) localStorage.setItem('profi_exercises', JSON.stringify(exercises)); }, [exercises]);
  useEffect(() => { localStorage.setItem('profi_calendar', JSON.stringify(calendarEvents)); }, [calendarEvents]);
  useEffect(() => { localStorage.setItem('profi_history', JSON.stringify(history)); }, [history]);

  // --- RATE LIMITING CHECK ---
  const checkRateLimits = (): boolean => {
      const now = Date.now();
      const limits = RATE_LIMITS[userState.plan];
      
      requestTimestamps.current = requestTimestamps.current.filter(t => t > now - 3600000);
      const requestsLastHour = requestTimestamps.current.length;
      const requestsLastMinute = requestTimestamps.current.filter(t => t > now - 60000).length;

      if (requestsLastMinute >= limits.maxRequestsPerMinute) {
          addToast('error', "Ralentissez ! Trop de requêtes par minute (Anti-Spam).");
          return false;
      }
      if (requestsLastHour >= limits.maxRequestsPerHour) {
          addToast('error', "Limite horaire atteinte. Faites une pause.");
          return false;
      }
      requestTimestamps.current.push(now);
      return true;
  };

  // --- ACTIONS ---
  
  const handlePlanSelection = (plan: 'TEACHER_PRO' | 'STUDENT_PASS_24H' | 'STUDENT_PACK_BAC') => {
    setIsPricingOpen(false);
    if (!session) {
        setAuthView('REGISTER');
        setIsAuthOpen(true);
        addToast('info', "Veuillez créer un compte pour vous abonner.");
    } else {
        console.log("Redirection Stripe pour le plan :", plan);
    }
  };

  const handleGenerate = useCallback(async () => {
    setAssignmentCode(null);
    setActiveDigitalAssignment(null);
    setIsStudentView(false);
    setIsAssignmentCompleted(false);
    
    if (systemConfig.maintenanceMode && !isAdminMode) {
        addToast('error', "Système en maintenance. Réessayez plus tard.");
        return;
    }

    if (options.useAI) {
        if (!session) { setAuthView('LOGIN'); setIsAuthOpen(true); addToast('info', "Connectez-vous pour utiliser l'IA."); return; }
        // On bypass la vérif email si c'est le user démo
        if (session.user.id !== 'demo-teacher-id' && !session.user.email_confirmed_at) { 
            addToast('error', "Veuillez valider votre email avant d'utiliser l'IA."); 
            return; 
        }
        if (userState.dailyCredits <= 0) { setIsPricingOpen(true); addToast('error', "Crédits épuisés pour aujourd'hui."); return; }
        if (!systemConfig.allowFreeAI && userState.plan === 'TEACHER_FREE') { addToast('error', "Le mode IA est temporairement réservé aux membres Pro."); return; }
        
        if (!checkRateLimits()) return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      let results: Exercise[];
      if (options.useAI) {
        results = await generateExercises(options, systemConfig.aiModel);
        const newCredits = Math.max(0, userState.dailyCredits - 1);
        setUserState(prev => ({ ...prev, dailyCredits: newCredits }));
        
        if (supabase && session && session.user.id !== 'demo-teacher-id') {
            await supabase.from('profiles').update({ daily_credits: newCredits }).eq('id', session.user.id);
        }
      } else {
        results = await generateLocalExercises(options);
      }
      setExercises(results);
      
      // Save to History
      const newItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          dateStr: new Date().toISOString(),
          options: { ...options },
          exercises: results
      };
      
      setHistory(prev => [newItem, ...prev].slice(0, 50));

      if (session?.user && session.user.id !== 'demo-teacher-id') {
          addToHistory(session.user.id, newItem);
      }

      addToast('success', "Génération réussie !");
      setTimeout(() => document.getElementById('content-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Une erreur technique est survenue.");
      addToast('error', "Oups ! La génération a échoué.");
    } finally {
      setIsLoading(false);
    }
  }, [options, userState, systemConfig, session]);

  const handleLoadHistory = (item: HistoryItem) => {
      setOptions(item.options);
      setExercises(item.exercises);
      setActiveTab('GENERATOR');
      addToast('info', `Sujet chargé : ${item.options.subject} - ${item.options.chapter}`);
      setTimeout(() => document.getElementById('content-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleDeleteHistory = (id: string) => {
      if(confirm("Confirmer la suppression ?")) {
          setHistory(prev => prev.filter(h => h.id !== id));
          if (session?.user && session.user.id !== 'demo-teacher-id') {
              removeFromHistory(session.user.id, id);
          }
          addToast('success', "Supprimé de l'historique");
      }
  };

  const handleWordExport = useCallback(async () => {
      if (!exercises) return;
      try {
          const blob = await generateWordDocument(exercises, options, assignmentCode || undefined);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `DS_NajahIA_${options.subject}_${new Date().toISOString().slice(0,10)}.docx`;

          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          addToast('success', "Document Word téléchargé !");
      } catch (e) {
          console.error("Erreur export Word:", e);
          addToast('error', "Erreur lors de l'export.");
      }
  }, [exercises, options, assignmentCode]);

  const handleAssignClass = async () => {
      if (!exercises || !session) return;
      // Pour le mode démo, on simule un succès
      if (session.user.id === 'demo-teacher-id') {
          const fakeCode = "DEMO-123";
          setAssignmentCode(fakeCode);
          addToast('success', `Mode Démo : Devoir simulé ! Code : ${fakeCode}`);
          return;
      }

      const code = await createAssignment(exercises, options, session.user.id);
      if (code) {
          setAssignmentCode(code);
          addToast('success', `Devoir créé ! Code : ${code}`);
          addToast('info', "Conformité CNDP : Ce devoir expirera automatiquement dans 30 jours.");
      } else {
          addToast('error', "Erreur création devoir.");
      }
  };

  const handleOpenPlanning = () => {
      setIsPlanningModalOpen(true);
  };

  const handleConfirmPlanning = (eventData: { id?: number; title: string; date: string; type: 'CONTROLE' }) => {
      if (!exercises) return;

      if (eventData.id) {
          setCalendarEvents(prev => prev.map(evt => 
              evt.id === eventData.id 
              ? { ...evt, linkedContent: exercises, linkedOptions: options } 
              : evt
          ));
          addToast('success', `Contenu ajouté au contrôle "${eventData.title}" !`);
      } else {
          const newEvent: ExamEvent = {
              id: Date.now(),
              title: eventData.title,
              date: eventData.date,
              type: 'CONTROLE',
              description: `Chapitre : ${options.chapter}`,
              linkedContent: exercises,
              linkedOptions: options
          };
          setCalendarEvents(prev => [...prev, newEvent]);
          addToast('success', "Nouveau contrôle planifié avec succès !");
      }
      setActiveTab('PREPARATION');
  };

  const handleLoadFromCalendar = (event: ExamEvent) => {
      if (event.linkedContent && event.linkedOptions) {
          setExercises(event.linkedContent);
          setOptions(event.linkedOptions);
          setActiveTab('GENERATOR');
          addToast('info', `Sujet chargé : ${event.title}`);
          setTimeout(() => document.getElementById('content-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
  };

  const handleJoinAssignment = async (code: string) => {
      setIsLoading(true);
      setError(null);
      setAssignmentCode(code); 
      try {
          // Fallback Démo
          if (code === "DEMO-123") {
              // On recharge les exercices courants comme si c'était le devoir
              if (exercises) {
                  setIsStudentView(true);
                  setIsAssignmentCompleted(false);
                  addToast('success', "Devoir de démonstration chargé !");
                  setIsLoading(false);
                  return;
              }
          }

          const assignment = await getAssignmentByCode(code);
          if (assignment) {
              if (assignment.isQuiz) {
                  try {
                      const questions = JSON.parse(assignment.exercises[0].enonce);
                      setActiveDigitalAssignment({
                          questions: questions,
                          code: code,
                          options: assignment.options
                      });
                      setActiveTab('PREPARATION');
                      addToast('success', "Quiz interactif chargé !");
                  } catch(e) {
                      addToast('error', "Erreur format quiz.");
                  }
              } else {
                  // Mode Lecture Standard -> VUE ÉLÈVE
                  setExercises(assignment.exercises);
                  setOptions(assignment.options);
                  setActiveTab('GENERATOR');
                  setIsStudentView(true); // ACTIVE LE MODE ÉLÈVE
                  setIsAssignmentCompleted(false);
                  addToast('success', "Sujet chargé ! Entrez votre nom pour valider.");
                  setTimeout(() => document.getElementById('content-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
              }
          } else {
              setError("Code devoir introuvable ou expiré.");
              addToast('error', "Ce code n'est pas valide ou a expiré (Droit à l'oubli).");
          }
      } catch (e) {
          setError("Erreur de connexion.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleCompleteAssignment = async () => {
      if (!studentName.trim()) {
          addToast('error', "Veuillez entrer votre nom complet.");
          return;
      }
      if (!assignmentCode) return;

      setIsLoading(true);
      
      // Mode Démo
      if (assignmentCode === "DEMO-123") {
           setTimeout(() => {
               setIsAssignmentCompleted(true);
               addToast('success', "Devoir validé (Simulation) !");
               setIsLoading(false);
           }, 1000);
           return;
      }

      const success = await submitStudentQuiz(assignmentCode, studentName, -1, exercises?.length || 0, { status: "read" });
      
      if (success) {
          setIsAssignmentCompleted(true);
          addToast('success', "Devoir validé ! Le professeur a reçu la confirmation.");
      } else {
          addToast('error', "Erreur d'envoi. Réessayez.");
      }
      setIsLoading(false);
  };

  const handleLogout = async () => {
      // Logout mode démo
      localStorage.removeItem('profi_demo_session');
      localStorage.removeItem('profi_demo_email');
      // Logout Supabase
      if (supabase) await supabase.auth.signOut();
      // Reset state
      setSession(null);
      setUserState({ plan: 'TEACHER_FREE', role: 'TEACHER', dailyCredits: 3, maxDailyCredits: 3, lastRefillDate: new Date().toDateString(), features: PLAN_FEATURES['TEACHER_FREE'] });
      addToast('info', "Vous êtes déconnecté.");
      window.location.reload();
  };

  if (isAdminMode) return <AdminDashboard onLogout={() => setIsAdminMode(false)} setConfig={setSystemConfig} currentConfig={systemConfig} />;

  return (
    <div id="app-wrapper" className="min-h-screen flex flex-col relative text-slate-800">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div id="printable-area" className="hidden print:block">
         {/* Printable content will be rendered here */}
      </div>

      {systemConfig.globalAnnouncement && (
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-center py-2 px-4 text-sm font-bold shadow-lg relative z-50 no-print">
              📣 {systemConfig.globalAnnouncement}
          </div>
      )}

      <div className="print:hidden">
        {!isStudentView && (
            <Header
                credits={userState.dailyCredits}
                maxCredits={userState.maxDailyCredits}
                onOpenPricing={() => setIsPricingOpen(true)}
                userPlan={userState.plan}
                isAuthenticated={!!session}
                onLoginClick={() => { setAuthView('LOGIN'); setIsAuthOpen(true); }}
                onLogoutClick={handleLogout}
                userEmail={session?.user?.email}
                subscriptionEndDate={userState.subscriptionEndDate}
            />
        )}
        
        <main className="flex-grow container mx-auto p-4 md:p-4 lg:p-6 pt-6 relative z-10">
            {!isStudentView && (
                <div className="flex justify-start mb-10 no-print">
                    <div className="glass-panel p-1.5 rounded-2xl inline-flex shadow-xl">
                        <button onClick={() => setActiveTab('GENERATOR')} className={`px-6 md:px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'GENERATOR' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}>Générateur IA</button>
                        <button onClick={() => setActiveTab('PREPARATION')} className={`px-6 md:px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'PREPARATION' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}>{userState.plan === 'TEACHER_PRO' ? 'Classe Numérique' : 'Mon Espace'}</button>
                        <button onClick={() => setActiveTab('HISTORY')} className={`px-6 md:px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'HISTORY' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}>Historique</button>
                    </div>
                </div>
            )}

            {/* Switch des onglets */}
            {activeTab === 'HISTORY' ? (
                <HistoryView history={history} onLoad={handleLoadHistory} onDelete={handleDeleteHistory} />
            ) : activeTab === 'GENERATOR' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* SIDEBAR : Masquée en mode étudiant */}
                    {!isStudentView && (
                        <div id="sidebar-panel" className="lg:col-span-6 xl:col-span-5 relative print:hidden space-y-6">
                            {/* Selection Panel - Configuration hiérarchique */}
                            <SelectionPanel
                                options={options}
                                setOptions={setOptions}
                                userCycle={userState.preferredCycle}
                                isTeacher={userState.role === 'TEACHER'}
                            />
                            
                            {/* Config Panel - Paramètres avancés */}
                            <ConfigPanel
                                options={options}
                                setOptions={setOptions}
                                onGenerate={handleGenerate}
                                isLoading={isLoading}
                                isFreeUser={userState.plan === 'TEACHER_FREE' || userState.plan === 'STUDENT_FREE'}
                            />
                        </div>
                    )}


                    <div id="content-panel" className={`${isStudentView ? 'lg:col-span-12 max-w-4xl mx-auto' : 'lg:col-span-6 xl:col-span-7'} print:w-full print:col-span-12`}>
                    {isLoading ? <Loader /> : (exercises && (
                        <div className="animate-fade-in-up">
                                {/* BANNER ÉTUDIANT */}
                                {isStudentView && !isAssignmentCompleted && (
                                    <div className="bg-white border-2 border-indigo-100 p-4 mb-6 rounded-2xl shadow-sm animate-fade-in-up">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg">Espace Élève</h3>
                                                <p className="text-slate-500 text-sm">Veuillez vous identifier avant de commencer.</p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Votre Nom & Prénom</label>
                                            <input 
                                                type="text" 
                                                placeholder="Ex: Amine Benjelloun" 
                                                value={studentName}
                                                onChange={(e) => setStudentName(e.target.value)}
                                                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                                            />
                                        </div>
                                    </div>
                                )}

                                {isAssignmentCompleted && (
                                    <div className="bg-green-50 border border-green-200 p-4 mb-6 rounded-xl text-center animate-fade-in-up">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <h3 className="font-bold text-green-800 text-lg">Devoir validé !</h3>
                                        <p className="text-green-600 text-sm">Votre travail a été enregistré.</p>
                                        <button onClick={() => { setIsStudentView(false); setExercises(null); }} className="mt-4 text-green-700 underline text-sm hover:text-green-900">Retour à l'accueil</button>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mb-4 print:hidden">
                                    <h3 className="text-xl font-bold text-slate-800">{options.subject} - {options.chapter}</h3>
                                    
                                    {/* BOUTONS D'ACTION (Masqués en mode étudiant) */}
                                    {!isStudentView && (
                                        <div className="flex gap-2">
                                            <button onClick={handleAssignClass} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                                Assigner
                                            </button>
                                            
                                            <button 
                                                onClick={handleOpenPlanning} 
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md" 
                                                title="Lier ce devoir à une date du calendrier"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                Joindre le Devoir
                                            </button>

                                            <button onClick={handleWordExport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                                Word (.docx)
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {assignmentCode && !isStudentView && (
                                    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between print:hidden animate-fade-in-up">
                                        <div>
                                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Code Devoir Actif</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-widest">{assignmentCode}</p>
                                            <p className="text-xs text-slate-500">Partagez ce code avec vos élèves.</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <img src={`https://quickchart.io/chart?cht=qr&chs=100x100&chl=${encodeURIComponent(`https://najah-ia.ma/join/${assignmentCode}`)}`} alt="QR" className="w-16 h-16" />

                                        </div>
                                    </div>
                                )}

                                {/* EXERCICES - Nouveau ExamPreview Wireframe */}
                                <ExamPreview 
                                    exercises={exercises} 
                                    options={options}
                                    isLoading={isLoading}
                                    scale={0.85}
                                />


                                {/* BOUTON DE VALIDATION ETUDIANT */}
                                {isStudentView && !isAssignmentCompleted && (
                                    <div className="sticky bottom-6 z-30 mt-6">
                                        <div className="bg-white/90 backdrop-blur p-3 rounded-2xl shadow-2xl border border-indigo-100 text-center max-w-xl mx-auto">
                                            <button
                                                onClick={handleCompleteAssignment}
                                                disabled={isLoading || !studentName.trim()}
                                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                            >
                                                {isLoading ? 'Envoi en cours...' : 'Terminer et Envoyer ma copie'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </div>
                    ))}
                    {!exercises && !isLoading && !error && (
                        <div className="text-center py-20 opacity-50">
                            <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            <p className="text-lg font-medium">Configurez les options et lancez la génération</p>
                        </div>
                    )}
                    </div>
                </div>
            ) : (
                <ExamPreparation 
                    userPlan={userState.plan} 
                    level={options.level} 
                    onOpenPricing={() => setIsPricingOpen(true)} 
                    onGenerateClick={() => setActiveTab('GENERATOR')} 
                    options={options} 
                    onJoinClass={handleJoinAssignment}
                    activeAssignment={activeDigitalAssignment}
                    onExitAssignment={() => setActiveDigitalAssignment(null)}
                    externalEvents={calendarEvents}
                    onAddEvent={(evt) => setCalendarEvents(prev => [...prev, evt])}
                    onLoadContent={handleLoadFromCalendar}
                />
            )}
        </main>

        <Footer onAdminClick={() => setShowAdminLogin(true)} />

        <PlanningModal 
            isOpen={isPlanningModalOpen} 
            onClose={() => setIsPlanningModalOpen(false)}
            onConfirm={handleConfirmPlanning}
            existingEvents={calendarEvents}
            subject={options.subject}
        />

        <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} onUpgrade={handlePlanSelection} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialView={authView} />
        <AdminLogin isOpen={showAdminLogin} onClose={() => setShowAdminLogin(false)} onLogin={() => { setShowAdminLogin(false); setIsAdminMode(true); }} />
      </div>
    </div>
  );
};

export default App;
