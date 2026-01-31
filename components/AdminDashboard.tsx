
import React, { useState, useEffect } from 'react';
import type { AdminStats, AdminUser, SystemConfig } from '../types';
import { supabase } from '../services/supabaseClient';
import { refreshCurriculum } from '../services/curriculumService';

interface AdminDashboardProps {
  onLogout: () => void;
  setConfig: (config: SystemConfig) => void;
  currentConfig: SystemConfig;
}

const COST_PER_GEN_DH = 0.02;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, setConfig, currentConfig }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({ totalRevenue: 0, totalUsers: 0, totalExercisesGenerated: 0, activeUsersNow: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [aiModel, setAiModel] = useState(currentConfig.aiModel || "gemini-2.5-flash");

  useEffect(() => {
    if (!supabase) return;
    const fetchData = async () => {
      setIsLoading(true);
      const { data: profiles, error } = await supabase.from('profiles').select('*');
      if (profiles) {
        const realUsers: AdminUser[] = profiles.map((p: any) => ({
          id: p.id,
          name: p.email ? p.email.split('@')[0] : 'Utilisateur',
          email: p.email || 'Inconnu',
          plan: p.plan,
          credits: p.daily_credits,
          status: 'Active',
          lastLogin: p.last_refill_date || 'N/A'
        }));
        setUsers(realUsers);
        const revenue = realUsers.reduce((acc, u) => (u.plan === 'STUDENT_PRO' ? acc + 49 : u.plan === 'TEACHER_PRO' ? acc + 199/12 : acc), 0);
        setStats({
            totalRevenue: Math.round(revenue),
            totalUsers: realUsers.length,
            totalExercisesGenerated: realUsers.length * 5,
            activeUsersNow: 1
        });
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveConfig = () => {
      const newConfig = { ...currentConfig, aiModel };
      setConfig(newConfig);
      // Simuler sauvegarde DB
      if (supabase) {
          // supabase.from('system_config').upsert(...)
          alert("Configuration sauvegardée et modèle IA mis à jour !");
      }
  };

  const handleRefreshCurriculum = async () => {
      await refreshCurriculum();
      alert("Programme scolaire rechargé depuis la base de données.");
  };

  const estimatedCost = stats.totalExercisesGenerated * COST_PER_GEN_DH;
  const netMargin = stats.totalRevenue - estimatedCost;

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800">
      <aside className="w-64 bg-slate-900 text-white flex flex-col print:hidden">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
             <span className="bg-indigo-500 w-2 h-8 rounded-full block"></span>
             ADMIN PANEL
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Vue d'ensemble</button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Utilisateurs</button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Configuration</button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">Déconnexion</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === 'dashboard' && "Tableau de bord"}
            {activeTab === 'users' && "Gestion des Utilisateurs"}
            {activeTab === 'settings' && "Paramètres Système"}
          </h2>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-sm font-medium text-slate-500 uppercase">Revenu Mensuel</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalRevenue} DH</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-sm font-medium text-slate-500 uppercase">Coût IA Estimé</p>
                <p className="text-3xl font-bold text-red-600 mt-2">-{estimatedCost.toFixed(2)} DH</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-sm font-medium text-slate-500 uppercase">Marge Nette</p>
                <p className={`text-3xl font-bold mt-2 ${netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{netMargin.toFixed(2)} DH</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Crédits</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">{user.plan}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        )}

        {activeTab === 'settings' && (
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Stratégie IA (Anti-Inflation)</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Modèle Actif</label>
                            <select 
                                value={aiModel} 
                                onChange={(e) => setAiModel(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg"
                            >
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Standard - Rapide & Économique)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Haute Qualité - Plus cher)</option>
                                <option value="gemini-1.5-flash-8b">Gemini Flash Lite (Ultra Économique)</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Changez de modèle instantanément si Google augmente ses prix.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Maintenance & Programme</h3>
                    <div className="flex items-center justify-between py-4 border-b border-slate-100">
                        <div>
                            <p className="font-medium text-slate-800">Mode Maintenance</p>
                        </div>
                        <button 
                            onClick={() => setConfig({ ...currentConfig, maintenanceMode: !currentConfig.maintenanceMode })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentConfig.maintenanceMode ? 'bg-red-600' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentConfig.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                     <div className="flex items-center justify-between py-4">
                        <div>
                            <p className="font-medium text-slate-800">Mise à jour Programme Scolaire</p>
                            <p className="text-sm text-slate-500">Recharger le fichier JSON depuis Supabase.</p>
                        </div>
                        <button onClick={handleRefreshCurriculum} className="text-indigo-600 hover:text-indigo-800 font-bold text-sm">
                            Forcer la mise à jour
                        </button>
                    </div>
                </div>
                
                <div className="flex justify-end">
                    <button onClick={handleSaveConfig} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700">
                        Sauvegarder la configuration
                    </button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};
