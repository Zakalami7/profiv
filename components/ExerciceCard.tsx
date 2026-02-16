
/**
 * Composant ExerciceCard pour l'affichage des exercices
 * Supporte: Drag & Drop, Affichage question/corrigé, Export PDF/Word
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
  FileText, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  GripVertical,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import type { Exercise } from '../types';

interface ExerciceCardProps {
  exercise: Exercise;
  index: number;
  isDragging?: boolean;
  showCorrection?: boolean;
  onToggleCorrection?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  onCopy?: (content: string) => void;
  onExportPDF?: () => void;
  onExportWord?: () => void;
  className?: string;
}



const ExerciceCard: React.FC<ExerciceCardProps> = ({
  exercise,
  index,
  isDragging = false,
  showCorrection = false,
  onToggleCorrection,
  onDragStart,
  onDragEnd,
  onCopy,
  onExportPDF,
  onExportWord,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = (content: string) => {
    if (onCopy) {
      onCopy(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`${className} ${isDragging ? 'opacity-50' : ''}`}
    >
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
    >

      {/* Header de la carte */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <GripVertical className="text-gray-400 cursor-move" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">
            {exercise.title || `Exercice ${index + 1}`}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={isExpanded ? 'Réduire' : 'Déplier'}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {onToggleCorrection && (
            <button
              onClick={onToggleCorrection}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={showCorrection ? 'Masquer la correction' : 'Afficher la correction'}
            >
              {showCorrection ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Contenu de la carte */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4"
          >
            {/* Énoncé */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Énoncé
                </h4>
                {onCopy && (
                  <button
                    onClick={() => handleCopy(exercise.enonce)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copié!' : 'Copier'}
                  </button>
                )}
              </div>
              <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {exercise.enonce}
                </ReactMarkdown>
              </div>
            </div>

            {/* Correction */}
            {showCorrection && exercise.corrige && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-green-600 uppercase tracking-wide">
                    Correction
                  </h4>
                  {onCopy && (
                    <button
                      onClick={() => handleCopy(exercise.corrige!)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copié!' : 'Copier'}
                    </button>
                  )}
                </div>
                <div className="prose prose-sm max-w-none bg-green-50 rounded-lg p-4">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {exercise.corrige}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Illustration SVG si présente */}
            {exercise.illustrationSVG && (
              <div className="mt-4">
                <div
                  className="bg-white border border-gray-200 rounded-lg p-4"
                  dangerouslySetInnerHTML={{ __html: exercise.illustrationSVG }}
                />
              </div>
            )}

            {/* Actions d'export */}
            <div className="mt-6 flex gap-2 justify-end">
              {onExportPDF && (
                <button
                  onClick={onExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FileText size={18} />
                  <span>PDF</span>
                </button>
              )}
              {onExportWord && (
                <button
                  onClick={onExportWord}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={18} />
                  <span>Word</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </div>
  );
};


export default ExerciceCard;
