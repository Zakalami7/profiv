import React from 'react';
import type { Exercise, ExerciseOptions } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cleanLatexContent } from '../utils/latexUtils';

interface PrintableExamProps {
  exercises: Exercise[];
  options: ExerciseOptions;
  assignmentCode?: string;
}

export const PrintableExam: React.FC<PrintableExamProps> = ({ exercises, options, assignmentCode }) => {
  const currentYear = new Date().getFullYear();
  const isArabicSubject = ["Arabe", "Education Islamique"].includes(options.subject);

  // Style de base : Times New Roman, Noir et Blanc pour économie d'encre
  return (
    <div className={`printable-content font-serif text-black leading-relaxed relative ${isArabicSubject ? 'text-right' : 'text-left'}`} dir={isArabicSubject ? 'rtl' : 'ltr'}>

      {/* --- EN-TÊTE OFFICIEL --- CONDITIONNEL */}
      {options.includeOfficialHeader && (
        <table className="w-full mb-6 border-collapse border-b-2 border-black pb-4">
          <tbody>
            <tr>
              <td className="w-1/3 text-center align-top p-1 text-[11px] font-bold uppercase">
                <p>{isArabicSubject ? "المملكة المغربية" : "Royaume du Maroc"}</p>
                <p>{isArabicSubject ? "وزارة التربية الوطنية" : "Ministère de l'Éducation Nationale,"}</p>
                <p>{!isArabicSubject && "du Préscolaire et des Sports"}</p>
                <p className="mt-2 text-xs">{options.schoolName || "........................"}</p>
              </td>
              <td className="w-1/3 text-center align-top p-1">
                <div className="border-2 border-black p-2 mx-auto max-w-[250px]">
                  <h1 className="text-xl font-black uppercase m-0">{isArabicSubject ? "فرض محروس" : "DEVOIR SURVEILLÉ"}</h1>
                  <p className="text-sm font-bold mt-1 uppercase">{options.subject}</p>
                </div>
              </td>
              <td className="w-1/3 text-center align-top p-1 text-[11px] font-bold">
                <p>{isArabicSubject ? "السنة الدراسية" : "Année Scolaire"} : {currentYear}/{currentYear + 1}</p>
                <p className="mt-1">{isArabicSubject ? "الأستاذ" : "Pr."} {options.professorName || "................"}</p>
                <p className="mt-1">{isArabicSubject ? "المستوى" : "Niveau"} : {options.level.split('-')[0]}</p>
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Cadre Note et Durée */}
      <div className="flex justify-between items-center mb-8 text-sm font-bold px-1">
           <div>Durée : 2 heures</div>
           <div className="border border-black px-8 py-2 bg-gray-50">Note : ....... / 20</div>
      </div>

      {/* --- EXERCICES --- */}
      <div className="space-y-6">
        {exercises.map((ex, idx) => (
          <div key={idx} className="break-inside-avoid">
            <div className="flex items-center gap-2 mb-3 border-b border-black pb-1">
                <span className="font-bold text-lg underline uppercase">
                    {isArabicSubject ? `تمرين ${idx + 1}` : `Exercice ${idx + 1}`}
                </span>
                <span className="text-sm italic">
                     {ex.title?.includes('(') ? `(${ex.title.split('(')[1]}` : ''}
                </span>
            </div>

            {ex.illustrationSVG && (
               <div className="my-2 flex justify-center" dangerouslySetInnerHTML={{ __html: ex.illustrationSVG }} />
            )}

            <div className={`prose prose-sm max-w-none font-serif text-justify ${isArabicSubject ? 'text-right' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[[rehypeKatex, {
                    strict: false,
                    trust: true,
                    throwOnError: false,
                    macros: { "\R": "\mathbb{R}", "\N": "\mathbb{N}", "\Z": "\mathbb{Z}" }
                }]]}
                components={{
                    h1: ({node, ...props}) => <h3 className="font-bold text-base mt-4 mb-2 uppercase underline" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 text-black" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                }}
              >
                {cleanLatexContent(ex.enonce)}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {/* --- SAUT DE PAGE CORRIGÉ --- */}
      <div className="page-break"></div>

      <div className="text-center mb-6 pt-6 border-t-2 border-black border-dashed">
        <h2 className="text-xl font-bold uppercase inline-block border-2 border-black px-6 py-2">
          {isArabicSubject ? "عناصر الإجابة" : "Corrigé et Barème"}
        </h2>
      </div>

      <div className="space-y-6">
        {exercises.map((ex, idx) => (
          <div key={idx} className="break-inside-avoid">
            <h4 className="font-bold mb-2 underline">
                {isArabicSubject ? `تصحيح التمرين ${idx + 1}` : `Correction Exercice ${idx + 1}`}
            </h4>
            <div className={`prose prose-sm max-w-none font-serif text-justify ${isArabicSubject ? 'text-right' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[[rehypeKatex, { strict: false, trust: true, throwOnError: false }]]}
                components={{
                    p: ({node, ...props}) => <p className="mb-2 text-black" {...props} />,
                }}
              >
                {cleanLatexContent(ex.corrige)}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {assignmentCode && (
        <div className="fixed bottom-4 right-4 text-[10px] text-gray-500">
            Code sujet : {assignmentCode}
        </div>
      )}
    </div>
  );
};
