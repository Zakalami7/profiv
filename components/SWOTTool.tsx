
import React, { useState } from 'react';
import { generateSWOTAnalysis } from '../services/geminiService';
import type { SWOTResult } from '../types';

export const SWOTTool: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [context, setContext] = useState('');
    const [result, setResult] = useState<SWOTResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!subject.trim()) return;
        setIsLoading(true);
        try {
            const data = await generateSWOTAnalysis(subject, context || "Contexte éducatif général (Lycée/Collège)");
            setResult(data);
        } catch (e) {
            alert("Erreur lors de l'analyse. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };

    const isRTL = result ? /[\u0600-\u06FF]/.test(result.synthesis) : false;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-12">
            
            {/* Header & Input Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Analyse Stratégique SWOT</h2>
                        <p className="text-slate-500">Identifiez les Forces, Faiblesses, Opportunités et Menaces de n'importe quel sujet.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sujet à analyser</label>
                        <input 
                            type="text" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            placeholder="Ex: Utilisation de l'IA en classe, Mon niveau en Mathématiques..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Contexte (Optionnel)</label>
                        <input 
                            type="text" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ex: Lycée Ibn Khaldoun, Classe de 2ème Bac..."
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleAnalyze}
                    disabled={isLoading || !subject.trim()}
                    className="mt-6 w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Analyse en cours...
                        </>
                    ) : (
                        "Lancer l'Analyse"
                    )}
                </button>
            </div>

            {/* Results Section */}
            {result && (
                <div className={`space-y-8 animate-fade-in-up ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    
                    {/* Synthesis Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-3xl border border-indigo-100 shadow-sm">
                        <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            {isRTL ? "ملخص التحليل" : "Synthèse Globale"}
                        </h3>
                        <p className="text-slate-700 leading-relaxed font-medium">{result.synthesis}</p>
                        
                        <div className="mt-6 pt-6 border-t border-indigo-100">
                            <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-3">{isRTL ? "نصائح استراتيجية" : "Conseil Stratégique"}</h4>
                            <div className="bg-white p-4 rounded-xl border border-indigo-50 text-slate-600 italic">
                                "{result.strategicAdvice}"
                            </div>
                        </div>
                    </div>

                    {/* SWOT Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Strengths */}
                        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4 text-emerald-800 border-b border-emerald-200 pb-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h3 className="font-bold text-lg">{isRTL ? "نقاط القوة" : "Forces (Strengths)"}</h3>
                            </div>
                            <ul className="space-y-3">
                                {result.strengths.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-emerald-900 font-medium text-sm">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4 text-orange-800 border-b border-orange-200 pb-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h3 className="font-bold text-lg">{isRTL ? "نقاط الضعف" : "Faiblesses (Weaknesses)"}</h3>
                            </div>
                            <ul className="space-y-3">
                                {result.weaknesses.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-orange-900 font-medium text-sm">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Opportunities */}
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4 text-blue-800 border-b border-blue-200 pb-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                </div>
                                <h3 className="font-bold text-lg">{isRTL ? "الفرص" : "Opportunités (Opportunities)"}</h3>
                            </div>
                            <ul className="space-y-3">
                                {result.opportunities.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-blue-900 font-medium text-sm">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Threats */}
                        <div className="bg-red-50 rounded-2xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4 text-red-800 border-b border-red-200 pb-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <h3 className="font-bold text-lg">{isRTL ? "التهديدات" : "Menaces (Threats)"}</h3>
                            </div>
                            <ul className="space-y-3">
                                {result.threats.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-red-900 font-medium text-sm">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};
