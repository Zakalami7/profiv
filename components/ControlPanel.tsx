
import React, { useState, useEffect, useMemo } from 'react';
import type { ExerciseOptions, PlanType, CycleType } from '../types';
import {
  LevelSelector,
  SubjectSelector,
  ChapterMultiSelect,
  DifficultyAndTypeSelector,
  ExerciseCountSlider,
} from './ControlPanel';

interface ControlPanelProps {
  options: ExerciseOptions;
  setOptions: React.Dispatch<React.SetStateAction<ExerciseOptions>>;
  onGenerate: () => void;
  isLoading: boolean;
  userPlan?: PlanType;
  userCycle?: CycleType;
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

export const ControlPanel: React.FC<ControlPanelProps> = ({
  options,
  setOptions,
  onGenerate,
  isLoading,
  userPlan = 'TEACHER_FREE',
  userCycle,
  onOpenPricing,
  userFeatures,
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isTeacher = userPlan === 'TEACHER_PRO';
  const isFreeUser = userPlan === 'TEACHER_FREE' || userPlan === 'STUDENT_FREE';
  const selectedChapters = options.selectedChapters || [];

  // Effect to enforce credit limits
  const maxExerciseCount = userFeatures?.maxDailyCredits || 3;

  useEffect(() => {
    if (
      isFreeUser &&
      options.exerciseCount > maxExerciseCount &&
      !selectedChapters.length
    ) {
      setOptions((prev) => ({ ...prev, exerciseCount: maxExerciseCount }));
    }
  }, [
    isFreeUser,
    options.exerciseCount,
    selectedChapters.length,
    setOptions,
    maxExerciseCount,
  ]);

  return (
    <div className="glass-panel p-6 rounded-3xl sticky top-24 transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </span>
          Configuration
        </h2>
      </div>

      {/* AI Toggle Modern */}
      <div className="mb-8 p-2 bg-slate-100/80 rounded-2xl flex relative shadow-inner">
        <button
          onClick={() => setOptions((prev) => ({ ...prev, useAI: true }))}
          className={`flex-1 py-3 text-base font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${
            options.useAI
              ? 'bg-white text-indigo-600 shadow-md transform scale-100'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Mode IA
        </button>
        <button
          onClick={() => setOptions((prev) => ({ ...prev, useAI: false }))}
          className={`flex-1 py-3 text-base font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${
            !options.useAI
              ? 'bg-white text-emerald-600 shadow-md transform scale-100'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
          Mode Local
        </button>
      </div>

      <div className="space-y-6">
        {/* Teacher Features */}
        {isTeacher && (
          <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-100 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                  Pro
                </span>
                <p className="text-sm font-bold text-indigo-900 uppercase">
                  En-tête Officiel
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeOfficialHeader}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeOfficialHeader: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-indigo-600 bg-white border-2 border-indigo-300 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-indigo-800">
                  Inclure
                </span>
              </label>
            </div>
            {options.includeOfficialHeader && (
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  value={options.schoolName}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      schoolName: e.target.value,
                    }))
                  }
                  placeholder="Nom de l'école..."
                  className="w-full p-3 text-base border-0 border-b border-indigo-200 bg-transparent focus:ring-0 focus:border-indigo-600 placeholder-indigo-300/70"
                />
                <input
                  type="text"
                  value={options.professorName}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      professorName: e.target.value,
                    }))
                  }
                  placeholder="Nom du professeur..."
                  className="w-full p-3 text-base border-0 border-b border-indigo-200 bg-transparent focus:ring-0 focus:border-indigo-600 placeholder-indigo-300/70"
                />
              </div>
            )}
          </div>
        )}

        {/* Level Selector */}
        <LevelSelector
          options={options}
          setOptions={setOptions}
          userCycle={userCycle}
          userPlan={userPlan}
        />

        {/* Subject Selector */}
        <SubjectSelector
          options={options}
          setOptions={setOptions}
          isTransitioning={isTransitioning}
          setIsTransitioning={setIsTransitioning}
        />

        {/* Chapter Multi-Select */}
        <ChapterMultiSelect
          options={options}
          setOptions={setOptions}
          isFreeUser={isFreeUser}
        />

        {/* Difficulty and Type */}
        <DifficultyAndTypeSelector
          options={options}
          setOptions={setOptions}
          userPlan={userPlan}
          onOpenPricing={onOpenPricing}
        />

        {/* Exercise Count Slider */}
        <ExerciseCountSlider
          options={options}
          setOptions={setOptions}
          userPlan={userPlan}
          onOpenPricing={onOpenPricing}
        />

        {/* Generate Button */}
        <div className="pt-4">
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className={`w-full group relative flex justify-center items-center px-8 py-4 border-none text-base font-bold rounded-2xl text-white shadow-xl shadow-indigo-500/30 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-indigo-500/50 ${
              isLoading ? 'opacity-80' : ''
            }`}
          >
            <div
              className={`absolute inset-0 transition-all duration-300 ${
                options.useAI
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600'
              }`}
            ></div>
            <span className="relative z-10 flex items-center gap-3">
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Conception en cours...
                </>
              ) : options.useAI ? (
                "Générer l'Examen"
              ) : (
                'Aperçu Local'
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
