
import React, { useState, useEffect } from 'react';
import type { HistoryItem } from '../types';

interface HistoryViewProps {
    history: HistoryItem[];
    onLoad: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
}

const ITEMS_PER_PAGE = 6;

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onLoad, onDelete }) => {
    const [currentPage, setCurrentPage] = useState(1);

    // Calcul du nombre total de pages
    const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);

    // Retour à la page précédente si la page actuelle devient vide après suppression
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [history.length, totalPages, currentPage]);

    if (!history || history.length === 0) {
        return (
            <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Historique Vide</h3>
                <p className="text-slate-500 max-w-md">
                    Vos anciens sujets générés apparaîtront ici. Ils sont sauvegardés localement pour que vous puissiez les retrouver facilement.
                </p>
            </div>
        );
    }

    // Extraction des éléments de la page courante
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentItems = history.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            // Scroll léger vers le haut de la liste
            window.scrollTo({ top: 100, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                {currentItems.map((item) => (
                    <div key={item.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {new Date(item.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                    item.options.difficulty === 'Avancé' ? 'bg-red-50 text-red-600 border-red-100' :
                                    item.options.difficulty === 'Intermédiaire' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                    'bg-green-50 text-green-600 border-green-100'
                                }`}>
                                    {item.options.difficulty}
                                </span>
                            </div>
                            
                            <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {item.options.chapter}
                            </h3>
                            <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                                {item.options.subject}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    {item.exercises.length} Exos
                                </span>
                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                    {item.options.level.split('-')[0].trim()}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex gap-2">
                            <button 
                                onClick={() => onLoad(item)}
                                className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Ouvrir
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                className="w-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                                title="Supprimer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-4">
                    <button 
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    
                    <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                                    currentPage === page 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};