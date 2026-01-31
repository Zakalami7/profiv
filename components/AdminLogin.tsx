
import React, { useState } from 'react';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mot de passe en dur pour la démo : "admin"
    if (password === 'admin') {
      onLogin();
      setPassword('');
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-200">
        <div className="text-center mb-6">
          <div className="bg-slate-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Accès Administrateur</h2>
          <p className="text-slate-500 text-sm mt-1">Veuillez saisir le code de sécurité.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-center text-lg tracking-widest"
              placeholder="••••••"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-2 text-center">Mot de passe incorrect (Indice: admin)</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors shadow-lg shadow-slate-900/20"
            >
              Connexion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
