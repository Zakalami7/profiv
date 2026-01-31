
import React from 'react';

interface FooterProps {
  onAdminClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  return (
    <footer className="bg-white mt-8 border-t border-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-center text-sm text-slate-500">
                &copy; {new Date().getFullYear()} Générateur d'Exercices Sciences Maroc. 
                <span className="hidden sm:inline"> • </span>
                <br className="sm:hidden"/>
                Développé avec React & Gemini API.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
                <a href="#" className="hover:text-indigo-500 transition-colors">Mentions Légales</a>
                <span>•</span>
                <a href="#" className="hover:text-indigo-500 transition-colors">Contact</a>
                <span>•</span>
                {onAdminClick && (
                    <button onClick={onAdminClick} className="hover:text-indigo-600 flex items-center gap-1 transition-colors" title="Accès Admin">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Admin
                    </button>
                )}
            </div>
        </div>
      </div>
    </footer>
  );
};
