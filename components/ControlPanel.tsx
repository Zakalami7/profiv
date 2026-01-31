
import React, { useMemo, useState, useEffect } from 'react';
import type { ExerciseOptions, PlanType, ChapterConfig, CycleType } from '../types';
import { CURRICULUM, DIFFICULTIES, SUBJECT_TYPE_MAPPING, OBJECTIVES, canExportWord, canGenerateExercises } from '../constants';

interface ControlPanelProps {
  options: ExerciseOptions;
  setOptions: React.Dispatch<React.SetStateAction<ExerciseOptions>>;
  onGenerate: () => void;
  isLoading: boolean;
  userPlan?: PlanType;
  userCycle?: CycleType; // Nouveau prop pour le filtrage
  onOpenPricing?: () => void;
  userFeatures?: {
    canExportWord: boolean;
    maxDailyCredits: number;
    accessRevision: boolean;
    hasNoWatermark: boolean;
    canGenerateExercises: boolean;
    canAccessDetailedCorrections: boolean;
  };
}

const SelectInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  id: string;
  isLocked?: boolean;
  onLockClick?: () => void;
  className?: string;
}> = ({ label, value, onChange, options, id, isLocked, onLockClick, className = "" }) => (
  <div className={`group ${className}`}>
    <label htmlFor={id} className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-indigo-600">
      {label}
    </label>
    <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`block w-full p-4 pl-5 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl text-slate-800 font-medium text-base focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:ring-slate-300'}`}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </div>
        {isLocked && (
            <button
                onClick={onLockClick}
                className="absolute inset-y-0 right-10 flex items-center text-indigo-500 hover:text-indigo-700 cursor-pointer pointer-events-auto"
            >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            </button>
        )}
    </div>
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({ options, setOptions, onGenerate, isLoading, userPlan = 'TEACHER_FREE', userCycle, onOpenPricing, userFeatures }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isTeacher = userPlan === 'TEACHER_PRO';
  const isFreeUser = userPlan === 'TEACHER_FREE' || userPlan === 'STUDENT_FREE';

  // S'assurer que selectedChapters est initialisé
  const selectedChapters = options.selectedChapters || [];

  // Définir la limite d'exercices selon les features
  const maxExerciseCount = userFeatures?.maxDailyCredits || 3;

  // Effet pour forcer la limite si l'utilisateur est gratuit et a sélectionné trop d'exercices
  useEffect(() => {
    if (isFreeUser && options.exerciseCount > maxExerciseCount && !selectedChapters.length) {
        setOptions(prev => ({ ...prev, exerciseCount: maxExerciseCount }));
    }
  }, [isFreeUser, options.exerciseCount, selectedChapters.length, setOptions, maxExerciseCount]);

  // --- LOGIQUE DE FILTRAGE DES NIVEAUX ---
  const availableLevels = useMemo(() => {
    const allLevels = Object.keys(CURRICULUM);
    
    // Si c'est un prof, il voit tout
    if (isTeacher) return allLevels;
    
    // Si pas de cycle défini (visiteur non connecté), on montre tout par défaut
    if (!userCycle) return allLevels;

    // Sinon, on filtre selon le cycle choisi à l'inscription
    if (userCycle === 'PRIMAIRE') {
        return allLevels.filter(lvl => lvl.startsWith("Primaire"));
    } else if (userCycle === 'COLLEGE') {
        return allLevels.filter(lvl => lvl.startsWith("Collège"));
    } else if (userCycle === 'LYCEE') {
        // Le lycée inclut Tronc Commun, 1ère Bac, 2ème Bac
        return allLevels.filter(lvl => !lvl.startsWith("Primaire") && !lvl.startsWith("Collège"));
    }
    
    return allLevels;
  }, [userCycle, isTeacher]);

  // --- LOGIQUE TYPES D'EXERCICES DYNAMIQUES ---
  const availableExerciseTypes = useMemo(() => {
      // Retourne les types spécifiques à la matière ou la liste par défaut
      return SUBJECT_TYPE_MAPPING[options.subject] || SUBJECT_TYPE_MAPPING["DEFAULT"];
  }, [options.subject]);

  // Reset du type d'exercice si la matière change et que le type actuel n'est plus valide
  useEffect(() => {
      if (!availableExerciseTypes.includes(options.type)) {
          setOptions(prev => ({ ...prev, type: availableExerciseTypes[0] }));
      }
  }, [options.subject, availableExerciseTypes, options.type, setOptions]);


  // Effet de bord : Si le niveau actuel n'est pas dans la liste autorisée, on le change
  useEffect(() => {
      if (!availableLevels.includes(options.level)) {
          const newLevel = availableLevels[0];
          if (newLevel && CURRICULUM[newLevel]) {
             const newSubject = Object.keys(CURRICULUM[newLevel])[0];
             const newChapter = CURRICULUM[newLevel][newSubject][0];
             setOptions(prev => ({
                 ...prev,
                 level: newLevel,
                 subject: newSubject,
                 chapter: newChapter,
                 selectedChapters: []
             }));
          }
      }
  }, [availableLevels, options.level, setOptions]);

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = e.target.value;
    setIsTransitioning(true);
    setTimeout(() => {
        setOptions(prev => ({ 
            ...prev, 
            level: newLevel, 
            subject: Object.keys(CURRICULUM[newLevel])[0], 
            chapter: CURRICULUM[newLevel][Object.keys(CURRICULUM[newLevel])[0]][0],
            selectedChapters: [] // Reset selection on level change
        }));
        setIsTransitioning(false);
    }, 200);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSubject = e.target.value;
      setIsTransitioning(true);
      setTimeout(() => {
        setOptions(prev => ({ 
            ...prev, 
            subject: newSubject, 
            chapter: CURRICULUM[options.level][newSubject][0],
            selectedChapters: [] // Reset selection on subject change
        }));
        setIsTransitioning(false);
      }, 150);
  }

  const handleAddChapter = () => {
      const currentChapter = options.chapter;
      // Vérifier si déjà présent
      if (selectedChapters.some(c => c.chapter === currentChapter)) return;
      
      const newConfig: ChapterConfig = { chapter: currentChapter, count: 1 };
      const updatedChapters = [...selectedChapters, newConfig];
      
      setOptions(prev => ({
          ...prev,
          selectedChapters: updatedChapters,
          exerciseCount: updatedChapters.reduce((acc, curr) => acc + curr.count, 0)
      }));
  };

  const handleRemoveChapter = (chapterToRemove: string) => {
      const updatedChapters = selectedChapters.filter(c => c.chapter !== chapterToRemove);
      setOptions(prev => ({
          ...prev,
          selectedChapters: updatedChapters,
          exerciseCount: updatedChapters.reduce((acc, curr) => acc + curr.count, 0) || 1
      }));
  };

  const handleUpdateChapterCount = (chapter: string, delta: number) => {
      const updatedChapters = selectedChapters.map(c => {
          if (c.chapter === chapter) {
              const newCount = Math.max(1, c.count + delta);
              return { ...c, count: newCount };
          }
          return c;
      });
      setOptions(prev => ({
          ...prev,
          selectedChapters: updatedChapters,
          exerciseCount: updatedChapters.reduce((acc, curr) => acc + curr.count, 0)
      }));
  };

  const subjectsForLevel = useMemo(() => Object.keys(CURRICULUM[options.level] || {}), [options.level]);
  const chaptersForSubject = useMemo(() => CURRICULUM[options.level]?.[options.subject] || [], [options.level, options.subject]);

  const hasMultipleChapters = selectedChapters.length > 0;
  // Le chapitre sélectionné dans le dropdown est-il déjà dans la liste ?
  const isCurrentChapterAdded = selectedChapters.some(c => c.chapter === options.chapter);

  return (
    <div className="glass-panel p-6 rounded-3xl sticky top-24 transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
             <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </span>
             Configuration
          </h2>
      </div>
      
      {/* AI Toggle Modern */}
      <div className="mb-8 p-2 bg-slate-100/80 rounded-2xl flex relative shadow-inner">
        <button
            onClick={() => setOptions({ ...options, useAI: true })}
            className={`flex-1 py-3 text-base font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${options.useAI ? 'bg-white text-indigo-600 shadow-md transform scale-100' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Mode IA
        </button>
        <button
            onClick={() => setOptions({ ...options, useAI: false })}
            className={`flex-1 py-3 text-base font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${!options.useAI ? 'bg-white text-emerald-600 shadow-md transform scale-100' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
            Mode Local
        </button>
      </div>

      <div className="space-y-6">
        
        {isTeacher && (
            <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-100 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Pro</span>
                        <p className="text-sm font-bold text-indigo-900 uppercase">En-tête Officiel</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={options.includeOfficialHeader}
                            onChange={(e) => setOptions({ ...options, includeOfficialHeader: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 bg-white border-2 border-indigo-300 rounded focus:ring-indigo-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-indigo-800">Inclure</span>
                    </label>
                </div>
                {options.includeOfficialHeader && (
                    <div className="grid grid-cols-1 gap-4">
                        <input type="text" value={options.schoolName} onChange={(e) => setOptions({ ...options, schoolName: e.target.value })} placeholder="Nom de l'école..." className="w-full p-3 text-base border-0 border-b border-indigo-200 bg-transparent focus:ring-0 focus:border-indigo-600 placeholder-indigo-300/70" />
                        <input type="text" value={options.professorName} onChange={(e) => setOptions({ ...options, professorName: e.target.value })} placeholder="Nom du professeur..." className="w-full p-3 text-base border-0 border-b border-indigo-200 bg-transparent focus:ring-0 focus:border-indigo-600 placeholder-indigo-300/70" />
                    </div>
                )}
            </div>
        )}

        {/* --- NIVEAU SCOLAIRE (Filtré) --- */}
        <div className="relative">
            {userCycle && !isTeacher && (
                 <span className="absolute -top-7 right-0 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded">
                    Cycle : {userCycle}
                 </span>
            )}
            <SelectInput 
                id="level" 
                label="Niveau Scolaire" 
                value={options.level} 
                onChange={handleLevelChange} 
                options={availableLevels} 
                className="z-20 relative" 
            />
        </div>

        <div className={`space-y-4 transition-all duration-300 ${isTransitioning ? 'opacity-50 blur-[1px]' : 'opacity-100 blur-0'}`}>
            <SelectInput id="subject" label="Matière" value={options.subject} onChange={handleSubjectChange} options={subjectsForLevel} />
            
            {/* ZONE SÉLECTION MULTI-CHAPITRES AMÉLIORÉE */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-end">
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">
                        Chapitres (Synthèse)
                    </label>
                    {hasMultipleChapters && (
                        <button
                            onClick={() => setOptions(prev => ({ ...prev, selectedChapters: [], exerciseCount: isFreeUser ? 3 : 3 }))}
                            className="text-xs text-red-500 hover:text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded transition-colors"
                        >
                            Tout effacer
                        </button>
                    )}
                </div>
                
                {/* Liste des chapitres sélectionnés (Tags) */}
                {hasMultipleChapters && (
                    <div className="flex flex-wrap gap-3 mb-3">
                        {selectedChapters.map((conf, idx) => (
                            <div key={idx} className="flex items-center bg-white border border-indigo-200 rounded-lg shadow-sm pl-4 pr-2 py-2 animate-fade-in group hover:border-indigo-400 transition-colors">
                                <span className="text-sm font-bold text-indigo-900 mr-3 truncate max-w-[160px]" title={conf.chapter}>
                                    {conf.chapter}
                                </span>
                                <div className="flex items-center gap-1 bg-indigo-50 rounded px-2">
                                    <button onClick={() => handleUpdateChapterCount(conf.chapter, -1)} className="text-indigo-600 hover:text-indigo-800 font-bold px-2 text-sm">-</button>
                                    <span className="text-xs font-bold text-indigo-700 min-w-[16px] text-center">{conf.count}</span>
                                    <button onClick={() => handleUpdateChapterCount(conf.chapter, 1)} className="text-indigo-600 hover:text-indigo-800 font-bold px-2 text-sm">+</button>
                                </div>
                                <button onClick={() => handleRemoveChapter(conf.chapter)} className="ml-3 p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Sélecteur et Bouton Ajouter */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <select
                            value={options.chapter}
                            onChange={(e) => setOptions({ ...options, chapter: e.target.value })}
                            className="block w-full p-4 pl-5 bg-white border-0 ring-1 ring-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 transition-all appearance-none text-base"
                        >
                            {chaptersForSubject.map((opt) => {
                                const isAdded = selectedChapters.some(c => c.chapter === opt);
                                return (
                                    <option key={opt} value={opt} disabled={isAdded} className={isAdded ? 'text-slate-300 bg-slate-50' : ''}>
                                        {opt} {isAdded ? '✓' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                    <button
                        onClick={handleAddChapter}
                        disabled={isCurrentChapterAdded}
                        className={`px-5 py-3 rounded-xl font-bold text-base transition-all shadow-sm flex items-center gap-2 ${isCurrentChapterAdded ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        title="Ajouter ce chapitre au devoir"
                    >
                        <span>Ajouter</span>
                        {!isCurrentChapterAdded && <span className="text-xl leading-none mb-0.5">+</span>}
                    </button>
                </div>
                {hasMultipleChapters && (
                    <p className="text-[10px] text-indigo-500 font-medium italic mt-1 text-center bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100">
                        ✨ Mode Synthèse activé : L'IA générera un sujet reliant ces notions.
                    </p>
                )}
            </div>
        </div>

        {/* COMPTEUR TOTAL (Masqué ou Lecture seule si plusieurs chapitres) */}
        <div>
           <div className="flex justify-between items-center mb-2">
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Total Exercices</label>
               {isFreeUser && (
                   <button 
                      onClick={onOpenPricing} 
                      className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                   >
                       <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                       Max 3 (Découverte)
                   </button>
               )}
           </div>
           <div className={`bg-slate-50 p-4 rounded-xl border border-slate-200 ${hasMultipleChapters ? 'opacity-90' : ''}`}>
              <input 
                  type="range" 
                  min="1" 
                  max={hasMultipleChapters ? 10 : maxExerciseCount}
                  value={options.exerciseCount} 
                  onChange={(e) => {
                      if(!hasMultipleChapters) {
                          setOptions({ ...options, exerciseCount: parseInt(e.target.value) });
                      }
                  }} 
                  disabled={hasMultipleChapters}
                  className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${hasMultipleChapters ? 'cursor-not-allowed' : ''}`} 
               />
              <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
                  <span>1</span>
                  <span className="text-indigo-600 text-lg">{options.exerciseCount}</span>
                  <span>{hasMultipleChapters ? 'Auto' : maxExerciseCount}</span>
              </div>
              {hasMultipleChapters && (
                  <p className="text-[10px] text-center text-slate-500 mt-2 font-medium">Calculé automatiquement selon la somme des chapitres.</p>
              )}
           </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map(diff => (
                <button
                    key={diff}
                    onClick={() => (isFreeUser && diff === 'Avancé') ? onOpenPricing?.() : setOptions({ ...options, difficulty: diff })}
                    className={`p-3 rounded-xl text-sm font-bold border transition-all ${options.difficulty === diff ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'} ${(isFreeUser && diff === 'Avancé') ? 'opacity-50' : ''}`}
                >
                    {diff}
                </button>
            ))}
        </div>
        
        <SelectInput 
            id="type" 
            label="Type d'exercice" 
            value={options.type} 
            onChange={(e) => setOptions({ ...options, type: e.target.value })} 
            options={availableExerciseTypes} 
        />
        
        {!isFreeUser && (
            <SelectInput id="objective" label="Compétence" value={options.objective} onChange={(e) => setOptions({ ...options, objective: e.target.value })} options={OBJECTIVES} />
        )}

        <div className="pt-4">
            <button
            onClick={onGenerate}
            disabled={isLoading}
            className={`w-full group relative flex justify-center items-center px-8 py-4 border-none text-base font-bold rounded-2xl text-white shadow-xl shadow-indigo-500/30 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-indigo-500/50 ${isLoading ? 'opacity-80' : ''}`}
            >
                <div className={`absolute inset-0 transition-all duration-300 ${options.useAI ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}></div>
                <span className="relative z-10 flex items-center gap-3">
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Conception en cours...
                        </>
                    ) : (
                        options.useAI ? "Générer l'Examen" : "Aperçu Local"
                    )}
                </span>
            </button>
        </div>
      </div>
    </div>
  );
};
