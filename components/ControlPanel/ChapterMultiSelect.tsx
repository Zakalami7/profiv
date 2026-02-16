import React, { useMemo } from 'react';
import type { ExerciseOptions, ChapterConfig } from '../../types';
import { CURRICULUM } from '../../constants';

interface ChapterMultiSelectProps {
  options: ExerciseOptions;
  setOptions: React.Dispatch<React.SetStateAction<ExerciseOptions>>;
  isFreeUser: boolean;
}

export const ChapterMultiSelect: React.FC<ChapterMultiSelectProps> = ({
  options,
  setOptions,
  isFreeUser,
}) => {
  const selectedChapters = options.selectedChapters || [];
  const chaptersForSubject = useMemo(
    () => CURRICULUM[options.level]?.[options.subject] || [],
    [options.level, options.subject]
  );

  const hasMultipleChapters = selectedChapters.length > 0;
  const isCurrentChapterAdded = selectedChapters.some((c) => c.chapter === options.chapter);

  const handleAddChapter = () => {
    const currentChapter = options.chapter;
    // Vérifier si déjà présent
    if (selectedChapters.some((c) => c.chapter === currentChapter)) return;

    const newConfig: ChapterConfig = { chapter: currentChapter, count: 1 };
    const updatedChapters = [...selectedChapters, newConfig];

    setOptions((prev) => ({
      ...prev,
      selectedChapters: updatedChapters,
      exerciseCount: updatedChapters.reduce((acc, curr) => acc + curr.count, 0),
    }));
  };

  const handleRemoveChapter = (chapterToRemove: string) => {
    const updatedChapters = selectedChapters.filter((c) => c.chapter !== chapterToRemove);
    setOptions((prev) => ({
      ...prev,
      selectedChapters: updatedChapters,
      exerciseCount: updatedChapters.reduce((acc, curr) => acc + curr.count, 0) || 1,
    }));
  };

  const handleUpdateChapterCount = (chapter: string, delta: number) => {
    const updatedChapters = selectedChapters.map((c) => {
      if (c.chapter === chapter) {
        const newCount = Math.max(1, c.count + delta);
        return { ...c, count: newCount };
      }
      return c;
    });
    setOptions((prev) => ({
      ...prev,
      selectedChapters: updatedChapters,
      exerciseCount: updatedChapters.reduce((acc, curr) => acc + curr.count, 0),
    }));
  };

  return (
    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
      <div className="flex justify-between items-end">
        <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">
          Chapitres (Synthèse)
        </label>
        {hasMultipleChapters && (
          <button
            onClick={() =>
              setOptions((prev) => ({
                ...prev,
                selectedChapters: [],
                exerciseCount: isFreeUser ? 3 : 3,
              }))
            }
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
            <div
              key={idx}
              className="flex items-center bg-white border border-indigo-200 rounded-lg shadow-sm pl-4 pr-2 py-2 animate-fade-in group hover:border-indigo-400 transition-colors"
            >
              <span
                className="text-sm font-bold text-indigo-900 mr-3 truncate max-w-[160px]"
                title={conf.chapter}
              >
                {conf.chapter}
              </span>
              <div className="flex items-center gap-1 bg-indigo-50 rounded px-2">
                <button
                  onClick={() => handleUpdateChapterCount(conf.chapter, -1)}
                  className="text-indigo-600 hover:text-indigo-800 font-bold px-2 text-sm"
                >
                  -
                </button>
                <span className="text-xs font-bold text-indigo-700 min-w-[16px] text-center">
                  {conf.count}
                </span>
                <button
                  onClick={() => handleUpdateChapterCount(conf.chapter, 1)}
                  className="text-indigo-600 hover:text-indigo-800 font-bold px-2 text-sm"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => handleRemoveChapter(conf.chapter)}
                className="ml-3 p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
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
            onChange={(e) => setOptions((prev) => ({ ...prev, chapter: e.target.value }))}
            className="block w-full p-4 pl-5 bg-white border-0 ring-1 ring-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 transition-all appearance-none text-base"
          >
            {chaptersForSubject.map((opt) => {
              const isAdded = selectedChapters.some((c) => c.chapter === opt);
              return (
                <option
                  key={opt}
                  value={opt}
                  disabled={isAdded}
                  className={isAdded ? 'text-slate-300 bg-slate-50' : ''}
                >
                  {opt} {isAdded ? '✓' : ''}
                </option>
              );
            })}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <button
          onClick={handleAddChapter}
          disabled={isCurrentChapterAdded}
          className={`px-5 py-3 rounded-xl font-bold text-base transition-all shadow-sm flex items-center gap-2 ${
            isCurrentChapterAdded
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
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
  );
};
