
/**
 * Composant ExerciseGenerator pour la génération d'exercices
 * Formulaire avancé avec dropdowns Niveau/Matière/Thème/Difficulté
 * Mode professeur pour générer 10 exercices + auto-correction
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  Layers, 
  Zap,
  Settings,
  Check,
  X,
  Loader2,
  AlertCircle,
  EyeOff,
  Eye,
  FileText,
  Download
} from 'lucide-react';

import { clsx } from 'clsx';
import type { ExerciseOptions, Exercise } from '../types';
import { CURRICULUM } from '../constants';
import { generateExercises } from '../services/geminiService';
import { generateLocalExercises } from '../services/localService';
import ExerciceCard from './ExerciceCard';
import { toast } from 'react-hot-toast';

interface ExerciseGeneratorProps {
  onExercisesGenerated?: (exercises: Exercise[]) => void;
  initialOptions?: Partial<ExerciseOptions>;
  isProfessorMode?: boolean;
  className?: string;
}

const DIFFICULTY_LEVELS = [
  { value: 'Débutant', label: 'Débutant', icon: Target, color: 'text-green-600' },
  { value: 'Intermédiaire', label: 'Intermédiaire', icon: Layers, color: 'text-blue-600' },
  { value: 'Avancé', label: 'Avancé', icon: Zap, color: 'text-purple-600' }
];

const EXERCISE_TYPES = [
  'Connaissances',
  'Application',
  'Analyse',
  'Synthèse',
  'Compréhension de texte',
  'Expression écrite / Production',
  'Exercice de Grammaire / Conjugaison',
  'Analyse littéraire',
  'Analyse de versets coraniques / Hadiths',
  'Étude de situation problème'
];

const ExerciseGenerator: React.FC<ExerciseGeneratorProps> = ({
  onExercisesGenerated,
  initialOptions = {},
  isProfessorMode = false,
  className = ''
}) => {
  const [options, setOptions] = useState<ExerciseOptions>({
    level: initialOptions.level || 'Collège (3ème Année)',
    subject: initialOptions.subject || 'Mathématiques',
    chapter: initialOptions.chapter || '',
    difficulty: initialOptions.difficulty || 'Intermédiaire',
    type: initialOptions.type || 'Application',
    objective: initialOptions.objective || '',
    includeIllustration: initialOptions.includeIllustration ?? false,
    useAI: initialOptions.useAI ?? true,
    professorName: initialOptions.professorName || '',
    schoolName: initialOptions.schoolName || '',
    includeOfficialHeader: initialOptions.includeOfficialHeader ?? true,
    exerciseCount: isProfessorMode ? 10 : (initialOptions.exerciseCount || 5),
    selectedChapters: initialOptions.selectedChapters || [],
    // New options
    includeCorrigé: initialOptions.includeCorrigé ?? true,
    includeResponseElements: initialOptions.includeResponseElements ?? true,
    includeIllustrations: initialOptions.includeIllustrations ?? true,
    includeMinistryHeader: initialOptions.includeMinistryHeader ?? true
  });


  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCorrections, setShowCorrections] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Mettre à jour les matières disponibles quand le niveau change
  useEffect(() => {
    const levelData = CURRICULUM[options.level];
    if (levelData) {
      setSubjects(Object.keys(levelData));
      // Si la matière actuelle n'est pas disponible, sélectionner la première
      if (!levelData[options.subject]) {
        setOptions(prev => ({
          ...prev,
          subject: Object.keys(levelData)[0],
          chapter: '',
          includeCorrigé: prev.includeCorrigé,
          includeResponseElements: prev.includeResponseElements,
          includeIllustrations: prev.includeIllustrations,
          includeMinistryHeader: prev.includeMinistryHeader
        }));
      }

    }
  }, [options.level]);

  // Mettre à jour les chapitres disponibles quand la matière change
  useEffect(() => {
    const levelData = CURRICULUM[options.level];
    if (levelData && levelData[options.subject]) {
      setChapters(levelData[options.subject]);
      // Si le chapitre actuel n'est pas disponible, sélectionner le premier
      if (!levelData[options.subject].includes(options.chapter)) {
        setOptions(prev => ({
          ...prev,
          chapter: levelData[options.subject][0],
          includeCorrigé: prev.includeCorrigé,
          includeResponseElements: prev.includeResponseElements,
          includeIllustrations: prev.includeIllustrations,
          includeMinistryHeader: prev.includeMinistryHeader
        }));
      }

    }
  }, [options.level, options.subject]);

  const handleGenerate = async () => {
    if (!options.chapter) {
      setError('Veuillez sélectionner un chapitre');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let generatedExercises: Exercise[];

      if (options.useAI) {
        generatedExercises = await generateExercises(options);
      } else {
        generatedExercises = await generateLocalExercises(options);
      }

      setExercises(generatedExercises);
      setShowCorrections(false);

      if (onExercisesGenerated) {
        onExercisesGenerated(generatedExercises);
      }

      toast.success(`${generatedExercises.length} exercice(s) généré(s) avec succès`);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la génération des exercices';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newExercises = [...exercises];
    const draggedExercise = newExercises[draggedIndex];

    newExercises.splice(draggedIndex, 1);
    newExercises.splice(dropIndex, 0, draggedExercise);

    setExercises(newExercises);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Contenu copié dans le presse-papier');
  };

  const handleExportPDF = () => {
    toast.success('Export PDF en cours de développement');
  };

  const handleExportWord = () => {
    toast.success('Export Word en cours de développement');
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Formulaire de configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings size={28} className="text-blue-600" />
            Configuration de la série
          </h2>
          {isProfessorMode && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              <BookOpen size={16} />
              Mode Professeur
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sélection du niveau */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niveau
            </label>
            <select
              value={options.level}
              onChange={(e) => setOptions(prev => ({ ...prev, level: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.keys(CURRICULUM).map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Sélection de la matière */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matière
            </label>
            <select
              value={options.subject}
              onChange={(e) => setOptions(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Sélection du chapitre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chapitre
            </label>
            <select
              value={options.chapter}
              onChange={(e) => setOptions(prev => ({ ...prev, chapter: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un chapitre</option>
              {chapters.map(chapter => (
                <option key={chapter} value={chapter}>{chapter}</option>
              ))}
            </select>
          </div>

          {/* Sélection de la difficulté */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulté
            </label>
            <div className="flex gap-2">
              {DIFFICULTY_LEVELS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setOptions(prev => ({ ...prev, difficulty: value }))}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors',
                    options.difficulty === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Icon size={16} className={options.difficulty === value ? color : 'text-gray-500'} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sélection du type d'exercice */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'exercice
            </label>
            <select
              value={options.type}
              onChange={(e) => setOptions(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {EXERCISE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Nombre d'exercices */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre d'exercices
            </label>
            <input
              type="number"
              min="1"
              max={isProfessorMode ? 20 : 10}
              value={options.exerciseCount}
              onChange={(e) => setOptions(prev => ({ 
                ...prev, 
                exerciseCount: parseInt(e.target.value) || 1 
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Options supplémentaires */}
        <div className="mt-6 space-y-4">
          {/* Utiliser l'IA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">
                Utiliser l'intelligence artificielle
              </span>
            </div>
            <button
              onClick={() => setOptions(prev => ({ ...prev, useAI: !prev.useAI }))}
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                options.useAI ? 'bg-blue-600' : 'bg-gray-200'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  options.useAI ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Inclure des illustrations */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeIllustration"
              checked={options.includeIllustration}
              onChange={(e) => setOptions(prev => ({ ...prev, includeIllustration: e.target.checked }))}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeIllustration" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <BookOpen size={20} className="text-green-500" />
              Inclure des illustrations
            </label>
          </div>


          {/* En-tête officiel */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeOfficialHeader"
              checked={options.includeOfficialHeader}
              onChange={(e) => setOptions(prev => ({ ...prev, includeOfficialHeader: e.target.checked }))}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeOfficialHeader" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <Target size={20} className="text-red-500" />
              En-tête officiel
            </label>
          </div>

          {/* Inclure le corrigé */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeCorrigé"
              checked={options.includeCorrigé}
              onChange={(e) => setOptions(prev => ({ ...prev, includeCorrigé: e.target.checked }))}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeCorrigé" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <Check size={20} className="text-green-600" />
              Inclure le corrigé
            </label>
          </div>

          {/* Éléments de réponse détaillés */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeResponseElements"
              checked={options.includeResponseElements}
              onChange={(e) => setOptions(prev => ({ ...prev, includeResponseElements: e.target.checked }))}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeResponseElements" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <FileText size={20} className="text-blue-500" />
              Éléments de réponse détaillés
            </label>
          </div>


          {/* 🖼️ Illustrations */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeIllustrations"
              checked={options.includeIllustrations}
              onChange={(e) => setOptions(prev => ({ ...prev, includeIllustrations: e.target.checked }))}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeIllustrations" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <span className="text-lg">🖼️</span>
              Schémas et figures si pertinent
            </label>
          </div>

          {/* 🏛️ Format Ministère */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeMinistryHeader"
              checked={options.includeMinistryHeader}
              onChange={(e) => setOptions(prev => ({ ...prev, includeMinistryHeader: e.target.checked }))}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeMinistryHeader" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <span className="text-lg">🏛️</span>
              Format Ministère de l'Éducation
            </label>
          </div>

        </div>


        {/* Bouton de génération */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className={clsx(
              'flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-colors',
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Génération en cours...</span>
              </>
            ) : (
              <>
                <Zap size={20} />
                <span>Générer les exercices</span>
              </>
            )}
          </button>

          {/* Afficher/Masquer les corrections */}
          {exercises.length > 0 && (
            <button
              onClick={() => setShowCorrections(!showCorrections)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showCorrections ? <EyeOff size={20} /> : <Eye size={20} />}
              <span>{showCorrections ? 'Masquer' : 'Afficher'} les corrections</span>
            </button>
          )}
        </div>

        {/* Message d'erreur */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="flex-shrink-0 text-red-600 hover:text-red-800"
              >
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Liste des exercices générés */}
      <AnimatePresence>
        {exercises.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                Exercices générés ({exercises.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FileText size={18} />
                  <span>Exporter en PDF</span>
                </button>
                <button
                  onClick={handleExportWord}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={18} />
                  <span>Exporter en Word</span>
                </button>
              </div>
            </div>

            <div
              className="space-y-4"
              onDragOver={handleDragOver}
            >
              {exercises.map((exercise, index) => (
                <ExerciceCard
                  key={exercise.id || index}
                  exercise={exercise}
                  index={index}
                  isDragging={draggedIndex === index}
                  showCorrection={showCorrections}
                  onToggleCorrection={() => setShowCorrections(!showCorrections)}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onCopy={handleCopy}
                  onExportPDF={handleExportPDF}
                  onExportWord={handleExportWord}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExerciseGenerator;
