
import React, { useState } from 'react';
import { redirectToCheckout } from '../services/paymentService';
import { supabase } from '../services/supabaseClient';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: 'TEACHER_PRO' | 'STUDENT_PASS_24H' | 'STUDENT_PACK_BAC') => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'TEACHER' | 'STUDENT'>('TEACHER');

  if (!isOpen) return null;

  const handleSubscribe = async (plan: 'TEACHER_PRO' | 'STUDENT_PASS_24H' | 'STUDENT_PACK_BAC') => {
      setIsLoading(true);
      
      let email = "demo@local.ma";
      let userId = "local-guest";

      // Vérification de la session uniquement si Supabase est actif
      if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.user?.email) {
              // Si pas connecté, on délègue à App.tsx qui ouvrira la modale de connexion
              onUpgrade(plan); 
              return;
          }
          
          email = session.user.email;
          userId = session.user.id;
      }

      // Lancement du processus (Redirection ou Activation Directe)
      await redirectToCheckout(plan, email, userId);
      setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Overlay */}
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
            <button
              type="button"
              className="bg-white rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Fermer</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-white px-4 pt-8 pb-4 sm:p-8 sm:pb-8">
            <div className="text-center sm:mt-2 mb-8">
              <h3 className="text-3xl leading-6 font-extrabold text-slate-900" id="modal-title">
                Choisissez votre formule Najah IA
              </h3>
              <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                Des solutions adaptées aux enseignants et aux élèves marocains.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-slate-100 p-1 rounded-xl inline-flex">
                <button
                  onClick={() => setActiveTab('TEACHER')}
                  className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                    activeTab === 'TEACHER'
                      ? 'bg-white text-indigo-600 shadow-md'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Espace Enseignant
                </button>
                <button
                  onClick={() => setActiveTab('STUDENT')}
                  className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                    activeTab === 'STUDENT'
                      ? 'bg-white text-indigo-600 shadow-md'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Espace Élève
                </button>
              </div>
            </div>

            {/* Teacher Tab Content */}
            {activeTab === 'TEACHER' && (
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 max-w-5xl mx-auto px-2">
                {/* Pack Pédagogue (Gratuit) */}
                <div className="flex flex-col rounded-2xl border border-slate-200 shadow-sm bg-slate-50 relative">
                  <div className="p-6 flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">Pack Pédagogue</h3>
                    <p className="mt-4 flex items-baseline text-slate-900">
                      <span className="text-4xl font-extrabold tracking-tight">0 DH</span>
                      <span className="ml-1 text-xl font-semibold text-slate-500">/mois</span>
                    </p>
                    <p className="mt-6 text-slate-500 text-sm">Idéal pour découvrir</p>
                    <ul role="list" className="mt-6 space-y-4">
                      <li className="flex">
                        <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        <span className="ml-3 text-sm text-slate-500">Génération PDF simple</span>
                      </li>
                      <li className="flex">
                        <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        <span className="ml-3 text-sm text-slate-500">QR Codes</span>
                      </li>
                      <li className="flex">
                        <svg className="flex-shrink-0 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        <span className="ml-3 text-sm text-slate-500">Limites journalières</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-6 bg-slate-100 rounded-b-2xl">
                    <button onClick={onClose} className="w-full block bg-white border border-slate-300 rounded-lg py-2 px-4 text-center text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm">
                      Votre plan actuel
                    </button>
                  </div>
                </div>

                {/* Pack Expert */}
                <div className="flex flex-col rounded-2xl border-2 border-indigo-600 shadow-2xl bg-white relative transform scale-105 z-10">
                  <div className="absolute top-0 inset-x-0 -mt-4 flex justify-center">
                    <span className="bg-indigo-600 text-white px-6 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase shadow-md">
                      Recommandé
                    </span>
                  </div>
                  <div className="p-8 flex-1">
                    <h3 className="text-2xl font-bold text-indigo-700">Pack Expert</h3>
                    <p className="mt-4 flex items-baseline text-slate-900">
                      <span className="text-5xl font-extrabold tracking-tight">390 DH</span>
                      <span className="ml-1 text-xl font-semibold text-slate-500">/an</span>
                    </p>
                    <p className="mt-2 text-xs text-indigo-600 font-semibold bg-indigo-50 inline-block px-2 py-1 rounded">Pour les pros</p>
                    <p className="mt-6 text-slate-600">Export Word modifiable, Archivage illimité, Zéro logo</p>
                    <ul role="list" className="mt-8 space-y-4">
                      <li className="flex">
                        <div className="bg-indigo-100 rounded-full p-1">
                          <svg className="flex-shrink-0 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span className="ml-3 text-slate-700 font-medium">Export Word modifiable</span>
                      </li>
                      <li className="flex">
                        <div className="bg-indigo-100 rounded-full p-1">
                          <svg className="flex-shrink-0 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span className="ml-3 text-slate-700 font-medium">Archivage illimité</span>
                      </li>
                      <li className="flex">
                        <div className="bg-indigo-100 rounded-full p-1">
                          <svg className="flex-shrink-0 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span className="ml-3 text-slate-700 font-medium">Zéro logo</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-b-2xl">
                    <button
                      onClick={() => handleSubscribe('TEACHER_PRO')}
                      disabled={isLoading}
                      className="w-full block bg-indigo-600 border border-transparent rounded-xl py-4 px-6 text-center text-white font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Redirection...' : 'Devenir Expert'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Student Tab Content */}
            {activeTab === 'STUDENT' && (
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 max-w-5xl mx-auto px-2">
                {/* Pass Révision (24h) */}
                <div className="flex flex-col rounded-2xl border border-slate-200 shadow-sm bg-white relative">
                  <div className="p-6 flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">Pass Révision</h3>
                    <p className="mt-4 flex items-baseline text-slate-900">
                      <span className="text-4xl font-extrabold tracking-tight">20 DH</span>
                      <span className="ml-1 text-xl font-semibold text-slate-500">/ 24h</span>
                    </p>
                    <p className="mt-6 text-slate-500 text-sm">Urgence Exam</p>
                    <ul role="list" className="mt-6 space-y-4">
                      <li className="flex">
                        <svg className="flex-shrink-0 h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        <span className="ml-3 text-sm text-slate-700">Accès total pendant 24h</span>
                      </li>
                      <li className="flex">
                        <svg className="flex-shrink-0 h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        <span className="ml-3 text-sm text-slate-700">Idéal veille de contrôle</span>
                      </li>
                      <li className="flex">
                        <svg className="flex-shrink-0 h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        <span className="ml-3 text-sm text-slate-700">Paiement SMS/Carte</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-b-2xl">
                    <button
                      onClick={() => handleSubscribe('STUDENT_PASS_24H')}
                      disabled={isLoading}
                      className="w-full block bg-indigo-600 border border-transparent rounded-lg py-2 px-4 text-center text-white font-bold hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                    >
                      {isLoading ? '...' : 'Activer le Pass'}
                    </button>
                  </div>
                </div>

                {/* Pack Baccalauréat */}
                <div className="flex flex-col rounded-2xl border-2 border-indigo-600 shadow-2xl bg-white relative transform scale-105 z-10">
                  <div className="absolute top-0 inset-x-0 -mt-4 flex justify-center">
                    <span className="bg-indigo-600 text-white px-6 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase shadow-md">
                      Accès illimité jusqu'à la fin de l'année scolaire
                    </span>
                  </div>
                  <div className="p-8 flex-1">
                    <h3 className="text-2xl font-bold text-indigo-700">Pack Baccalauréat</h3>
                    <p className="mt-4 flex items-baseline text-slate-900">
                      <span className="text-5xl font-extrabold tracking-tight">300 DH</span>
                      <span className="ml-1 text-xl font-semibold text-slate-500">/ an</span>
                    </p>
                    <p className="mt-2 text-xs text-indigo-600 font-semibold bg-indigo-50 inline-block px-2 py-1 rounded">Accès illimité jusqu'à la fin de l'année scolaire</p>
                    <p className="mt-6 text-slate-600">Accès illimité jusqu'à la fin de l'année scolaire</p>
                    <ul role="list" className="mt-8 space-y-4">
                      <li className="flex">
                        <div className="bg-indigo-100 rounded-full p-1">
                          <svg className="flex-shrink-0 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span className="ml-3 text-slate-700 font-medium">Accès illimité AI Révision Tools</span>
                      </li>
                      <li className="flex">
                        <div className="bg-indigo-100 rounded-full p-1">
                          <svg className="flex-shrink-0 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span className="ml-3 text-slate-700 font-medium">Quiz interactifs</span>
                      </li>
                      <li className="flex">
                        <div className="bg-indigo-100 rounded-full p-1">
                          <svg className="flex-shrink-0 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span className="ml-3 text-slate-700 font-medium">Corrections détaillées</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-b-2xl">
                    <button
                      onClick={() => handleSubscribe('STUDENT_PACK_BAC')}
                      disabled={isLoading}
                      className="w-full block bg-indigo-600 border border-transparent rounded-xl py-4 px-6 text-center text-white font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Redirection...' : 'Acheter le Pack'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer B2B for Teachers */}
            {activeTab === 'TEACHER' && (
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-500">
                  Directeur d'école ? <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium">Demandez une licence Établissement (Sur devis)</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
