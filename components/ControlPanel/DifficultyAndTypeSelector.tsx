import React, { useMemo } from 'react';
import type { ExerciseOptions, PlanType } from '../../types';
import { DIFFICULTIES, SUBJECT_TYPE_MAPPING, OBJECTIVES } from '../../constants';

interface DifficultyAndTypeSelectorProps {
  options: ExerciseOptions;
  setOptions: React.Dispatch<React.SetStateAction<ExerciseOptions>>;
  userPlan?: PlanType;
  onOpenPricing?: () => void;
}

const SelectInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  id: string;
}> = ({ label, value, onChange, options, id }) => (
  <div className="group">
    <label htmlFor={id} className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2 transition-colors group-focus-within:text-indigo-600">
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="block w-full p-4 pl-5 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl text-slate-800 font-medium text-base focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);

export const DifficultyAndTypeSelector: React.FC<DifficultyAndTypeSelectorProps> = ({
  options,
  setOptions,
  userPlan = 'TEACHER_FREE',
  onOpenPricing,
}) => {
  const isFreeUser = userPlan === 'TEACHER_FREE' || userPlan === 'STUDENT_FREE';

  const availableExerciseTypes = useMemo(() => {
    return SUBJECT_TYPE_MAPPING[options.subject] || SUBJECT_TYPE_MAPPING['DEFAULT'];
  }, [options.subject]);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {DIFFICULTIES.map((diff) => (
          <button
            key={diff}
            onClick={() =>
              isFreeUser && diff === 'Avancé'
                ? onOpenPricing?.()
                : setOptions((prev) => ({ ...prev, difficulty: diff }))
            }
            className={`p-3 rounded-xl text-sm font-bold border transition-all ${
              options.difficulty === diff
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            } ${isFreeUser && diff === 'Avancé' ? 'opacity-50' : ''}`}
          >
            {diff}
          </button>
        ))}
      </div>

      <SelectInput
        id="type"
        label="Type d'exercice"
        value={options.type}
        onChange={(e) => setOptions((prev) => ({ ...prev, type: e.target.value }))}
        options={availableExerciseTypes}
      />

      {!isFreeUser && (
        <SelectInput
          id="objective"
          label="Compétence"
          value={options.objective}
          onChange={(e) => setOptions((prev) => ({ ...prev, objective: e.target.value }))}
          options={OBJECTIVES}
        />
      )}
    </>
  );
};
