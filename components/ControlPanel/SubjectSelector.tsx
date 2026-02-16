import React, { useMemo, useEffect } from 'react';
import type { ExerciseOptions } from '../../types';
import { CURRICULUM, SUBJECT_TYPE_MAPPING } from '../../constants';

interface SubjectSelectorProps {
  options: ExerciseOptions;
  setOptions: React.Dispatch<React.SetStateAction<ExerciseOptions>>;
  isTransitioning: boolean;
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>;
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

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  options,
  setOptions,
  isTransitioning,
  setIsTransitioning,
}) => {
  const subjectsForLevel = useMemo(
    () => Object.keys(CURRICULUM[options.level] || {}),
    [options.level]
  );

  const availableExerciseTypes = useMemo(() => {
    return SUBJECT_TYPE_MAPPING[options.subject] || SUBJECT_TYPE_MAPPING['DEFAULT'];
  }, [options.subject]);

  // Reset du type d'exercice si la matière change et que le type actuel n'est plus valide
  useEffect(() => {
    if (!availableExerciseTypes.includes(options.type)) {
      setOptions((prev) => ({ ...prev, type: availableExerciseTypes[0] }));
    }
  }, [options.subject, availableExerciseTypes, options.type, setOptions]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubject = e.target.value;
    setIsTransitioning(true);
    setTimeout(() => {
      setOptions((prev) => ({
        ...prev,
        subject: newSubject,
        chapter: CURRICULUM[options.level][newSubject][0],
        selectedChapters: [], // Reset selection on subject change
      }));
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <div
      className={`space-y-4 transition-all duration-300 ${
        isTransitioning ? 'opacity-50 blur-[1px]' : 'opacity-100 blur-0'
      }`}
    >
      <SelectInput
        id="subject"
        label="Matière"
        value={options.subject}
        onChange={handleSubjectChange}
        options={subjectsForLevel}
      />
    </div>
  );
};
