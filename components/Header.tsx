
import React, { useState, useEffect } from 'react';
import { PlanType } from '../types';

const CountdownTimer: React.FC<{ endDate?: string }> = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!endDate) return;

    const updateTimer = () => {
      const endTime = new Date(endDate);
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}min`);
      } else {
        setTimeLeft('Expiré');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endDate]);

  if (!endDate) return null;

  return (
    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
      {timeLeft}
    </span>
  );
};

interface HeaderProps {
  credits?: number;
  maxCredits?: number;
  onOpenPricing?: () => void;
  userPlan?: PlanType;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  userEmail?: string;
  subscriptionEndDate?: string;
}

export const Header: React.FC<HeaderProps> = ({
  credits,
  maxCredits,
  onOpenPricing,
  userPlan,
  isAuthenticated,
  onLoginClick,
  onLogoutClick,
  userEmail,
  subscriptionEndDate
}) => {
  const isLowCredits = credits <= 1;

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-20 rounded-xl group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none font-display">Profi<span className="text-indigo-600">.ai</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Maroc Edition</p>
            </div>
          </div>

          {/* Actions / Credits Area */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Credit Counter (Only if authenticated or pricing enabled) */}
            {onOpenPricing && (
              <div className="hidden md:flex flex-col items-end">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wide">
                      <span className="text-slate-400">Crédits Journaliers</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                     <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${isLowCredits ? 'bg-red-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${Math.min((credits / maxCredits) * 100, 100)}%`, transition: 'width 0.5s ease' }}
                        ></div>
                     </div>
                     <span className={`${isLowCredits ? 'text-red-600' : 'text-indigo-700'} text-sm font-bold`}>
                        {credits}/{maxCredits}
                     </span>
                  </div>
              </div>
            )}

            {/* Upgrade Button */}
            {onOpenPricing && (userPlan === 'TEACHER_FREE' || userPlan === 'STUDENT_FREE') && (
              <button
                  onClick={onOpenPricing}
                  className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-bold text-white transition-all duration-200 bg-slate-900 rounded-xl hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none"
              >
                  <svg className="w-4 h-4 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  Pro
              </button>
            )}

            {userPlan && userPlan !== 'TEACHER_FREE' && userPlan !== 'STUDENT_FREE' && (
                 <div className="hidden sm:flex items-center gap-2">
                     <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                         {userPlan === 'TEACHER_PRO' ? 'ENSEIGNANT PRO' :
                          userPlan === 'STUDENT_PASS_24H' ? 'PASS 24H' :
                          userPlan === 'STUDENT_PACK_BAC' ? 'PACK BAC' :
                          userPlan}
                     </span>
                     {userPlan === 'STUDENT_PASS_24H' && subscriptionEndDate && (
                         <CountdownTimer endDate={subscriptionEndDate} />
                     )}
                 </div>
            )}

            {/* Auth Section */}
            <div className="pl-2 sm:pl-4 border-l border-slate-200">
                {isAuthenticated ? (
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <div className="text-xs font-bold text-slate-900 max-w-[100px] truncate">{userEmail?.split('@')[0]}</div>
                            <button onClick={onLogoutClick} className="text-[10px] text-slate-500 hover:text-red-500 font-medium">Déconnexion</button>
                        </div>
                        <button 
                            onClick={() => {
                                if (window.confirm("Souhaitez-vous vous déconnecter ?")) {
                                    onLogoutClick?.();
                                }
                            }}
                            className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
                            title="Cliquez pour vous déconnecter"
                        >
                            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={onLoginClick}
                        className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                    >
                        Se connecter
                    </button>
                )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
