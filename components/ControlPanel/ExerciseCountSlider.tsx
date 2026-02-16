import React from 'react';
import type { ExerciseOptions, PlanType } from '../../types';

interface ExerciseCountSliderProps {
  options: ExerciseOptions;
  setOptions: React.Dispatch<React.SetStateAction<ExerciseOptions>>;
  userPlan?: PlanType;
  onOpenPricing?: () => void;
}

export const ExerciseCountSlider: React.FC<ExerciseCountSliderProps> = ({
  options,
  setOptions,
  userPlan = 'TEACHER_FREE',
  onOpenPricing,
}) => {
  const isFreeUser = userPlan === 'TEACHER_FREE' || userPlan === 'STUDENT_FREE';
  const selectedChapters = options.selectedChapters || [];
  const hasMultipleChapters = selectedChapters.length > 0;
  const maxExerciseCount = isFreeUser ? 3 : 50;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Total Exercices
        </label>
        {isFreeUser && (
          <button
            onClick={onOpenPricing}
            className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-1"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
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
            if (!hasMultipleChapters) {
              setOptions((prev) => ({
                ...prev,
                exerciseCount: parseInt(e.target.value),
              }));
            }
          }}
          disabled={hasMultipleChapters}
          className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${
            hasMultipleChapters ? 'cursor-not-allowed' : ''
          }`}
        />
        <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
          <span>1</span>
          <span className="text-indigo-600 text-lg">{options.exerciseCount}</span>
          <span>{hasMultipleChapters ? 'Auto' : maxExerciseCount}</span>
        </div>
        {hasMultipleChapters && (
          <p className="text-[10px] text-center text-slate-500 mt-2 font-medium">
            Calculé automatiquement selon la somme des chapitres.
          </p>
        )}
      </div>
    </div>
  );
};
