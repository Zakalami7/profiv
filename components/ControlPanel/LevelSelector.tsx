import React, { useMemo, useEffect } from 'react';
import type { ExerciseOptions, CycleType, PlanType } from '../../types';
import { CURRICULUM } from '../../constants';

interface LevelSelectorProps {
  options: ExerciseOptions;
  setOptions: React.Dispatch<React.SetStateAction<ExerciseOptions>>;
  userCycle?: CycleType;
  userPlan?: PlanType;
}

const SelectInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  id: string;
  sublabel?: string;
}> = ({ label, value, onChange, options, id, sublabel }) => (
  <div className="group relative">
    {sublabel && (
      <span className="absolute -top-7 right-0 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded">
        {sublabel}
      </span>
    )}
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

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  options,
  setOptions,
  userCycle,
  userPlan = 'TEACHER_FREE',
}) => {
  const isTeacher = userPlan === 'TEACHER_PRO';

  // --- LOGIQUE DE FILTRAGE DES NIVEAUX ---
  const availableLevels = useMemo(() => {
    const allLevels = Object.keys(CURRICULUM);

    // Si c'est un prof, il voit tout
    if (isTeacher) return allLevels;

    // Si pas de cycle défini (visiteur non connecté), on montre tout par défaut
    if (!userCycle) return allLevels;

    // Sinon, on filtre selon le cycle choisi à l'inscription
    if (userCycle === 'PRIMAIRE') {
      return allLevels.filter((lvl) => lvl.startsWith('Primaire'));
    } else if (userCycle === 'COLLEGE') {
      return allLevels.filter((lvl) => lvl.startsWith('Collège'));
    } else if (userCycle === 'LYCEE') {
      // Le lycée inclut Tronc Commun, 1ère Bac, 2ème Bac
      return allLevels.filter((lvl) => !lvl.startsWith('Primaire') && !lvl.startsWith('Collège'));
    }

    return allLevels;
  }, [userCycle, isTeacher]);

  // Effet de bord : Si le niveau actuel n'est pas dans la liste autorisée, on le change
  useEffect(() => {
    if (!availableLevels.includes(options.level)) {
      const newLevel = availableLevels[0];
      if (newLevel && CURRICULUM[newLevel]) {
        const newSubject = Object.keys(CURRICULUM[newLevel])[0];
        const newChapter = CURRICULUM[newLevel][newSubject][0];
        setOptions((prev) => ({
          ...prev,
          level: newLevel,
          subject: newSubject,
          chapter: newChapter,
          selectedChapters: [],
        }));
      }
    }
  }, [availableLevels, options.level, setOptions]);

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = e.target.value;
    setOptions((prev) => ({
      ...prev,
      level: newLevel,
      subject: Object.keys(CURRICULUM[newLevel])[0],
      chapter: CURRICULUM[newLevel][Object.keys(CURRICULUM[newLevel])[0]][0],
      selectedChapters: [], // Reset selection on level change
    }));
  };

  return (
    <div className="relative">
      <SelectInput
        id="level"
        label="Niveau Scolaire"
        value={options.level}
        onChange={handleLevelChange}
        options={availableLevels}
        sublabel={userCycle && !isTeacher ? `Cycle : ${userCycle}` : undefined}
      />
    </div>
  );
};
