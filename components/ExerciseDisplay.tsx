
import React, { useState } from 'react';
import type { Exercise, ExerciseOptions } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const isArabicText = (text: string): boolean => {

    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
};

const cleanLatexContent = (content: string): string => {
    if (!content) return "";
    let cleaned = content
        .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
        .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
        .replace(/(\d+)\.(\d+)[eE]([+-]?\d+)/g, '$1,$2 \\times 10^{$3}')
        .replace(/(\b\d+)[eE]([+-]?\d+)/g, '$1 \\times 10^{$2}')
        .replace(/(\d+)\.(\d+)\s*[\.\*x]\s*10\^([+-]?\d+|\{[^}]+\})/g, '$1,$2 \\times 10^{$3}')
        .replace(/(\d+)\s*[\.\*]\s*10\^([+-]?\d+|\{[^}]+\})/g, '$1 \\times 10^{$2}')
        .replace(/10\^([+-]?\d+)(?![0-9{])/g, '10^{$1}')
        .replace(/10\^\{\s*([+-]?\d+)\s*\}/g, '10^{$1}')
        .replace(/(\d)\\([a-zA-Z]+)/g, '$1 \\$2') 
        .replace(/(\d+)\s*Ω/g, '$1\\ \\Omega')
        .replace(/(\d+)\s*°C/g, '$1^{\\circ}C')
        .replace(/(\d+)\s*%/g, '$1\\ \\%')
        .replace(/\u00A0/g, ' ')
        .replace(/(\w)\$/g, '$1 $')
        .replace(/\$\$([^\n]{1,80}?)\$\$/g, (match, inner) => {
            if (inner.includes('\\\\') || inner.includes('\\begin{')) return match; 
            return `$${inner.trim()}$`;
        });
    return cleaned;
};

// --- SUB-COMPONENTS ---

const SafeSVGDisplay: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;
    const svgMatch = content.match(/<svg([^>]*)>([\s\S]*?)<\/svg>/i);
    if (!svgMatch) return null;
    let rootAttributes = svgMatch[1];
    let innerContent = svgMatch[2];
    rootAttributes = rootAttributes.replace(/\bwidth\s*=\s*["'][^"']*["']/gi, "").replace(/\bheight\s*=\s*["'][^"']*["']/gi, "").replace(/\bstyle\s*=\s*["'][^"']*["']/gi, "");
    if (!/viewBox\s*=/i.test(rootAttributes)) rootAttributes += ' viewBox="0 0 500 350"';
    if (!/preserveAspectRatio\s*=/i.test(rootAttributes)) rootAttributes += ' preserveAspectRatio="xMidYMid meet"';
    if (!/xmlns\s*=/i.test(rootAttributes)) rootAttributes += ' xmlns="http://www.w3.org/2000/svg"';

    const replacements: Record<string, string> = {
        '\\lambda': 'λ', '\\pi': 'π', '\\Delta': 'Δ', '\\Omega': 'Ω', '\\mu': 'µ',
        '\\alpha': 'α', '\\beta': 'β', '\\theta': 'θ', '\\rho': 'ρ', '\\sigma': 'σ',
        '\\tau': 'τ', '\\phi': 'φ', '\\psi': 'ψ', '\\omega': 'ω', '\\epsilon': 'ε',
        '\\gamma': 'γ', '\\delta': 'δ', '\\eta': 'η', '\\nu': 'ν',
        '\\times': '×', '\\cdot': '⋅', '\\pm': '±', '\\mp': '∓',
        '\\le': '≤', '\\ge': '≥', '\\neq': '≠', '\\approx': '≈', '\\sim': '∼',
        '\\infty': '∞', '\\rightarrow': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
        '\\Rightarrow': '⇒', '\\Leftrightarrow': '⇔', '\\degree': '°', '^{\\circ}': '°',
        '\\vec': '', '\\mathbf': '', '\\mathrm': '', '\\text': '', '\\sqrt': '√'
    };
    Object.entries(replacements).forEach(([key, val]) => {
        innerContent = innerContent.replace(new RegExp(key.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), val);
    });
    innerContent = innerContent.replace(/>\s*\$([^<]+)\$\s*</g, '>$1<'); 
    innerContent = innerContent.replace(/>([^<]+)</g, (match, text) => {
        let clean = text.replace(/_\{([0-9]+)\}/g, (m, d) => d.split('').map((c: string) => '₀₁₂₃₄₅₆₇₈₉'[parseInt(c)]).join('')).replace(/\^\{([0-9]+)\}/g, (m, d) => d.split('').map((c: string) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(c)]).join('')).replace(/_\{([^}]+)\}/g, '$1').replace(/\^\{([^}]+)\}/g, '$1').replace(/\{([^}]+)\}/g, '$1');
        return `>${clean}<`;
    });
    const fullSvg = `<svg ${rootAttributes} width="100%" height="100%" style="display: block; margin: auto; max-height: 500px; width: 100%; overflow: visible;">${innerContent}</svg>`;


    return <figure className="my-8 flex justify-center items-center p-4 bg-white border border-slate-100 rounded-lg shadow-sm print:shadow-none print:border-none select-none overflow-hidden"><div className="w-full max-w-2xl svg-container" dangerouslySetInnerHTML={{ __html: fullSvg }} /></figure>;
};

const MarkdownContent: React.FC<{ content: string; variant: 'exam' | 'solution' }> = ({ content, variant }) => {
    const cleaned = cleanLatexContent(content);
    const isRTL = isArabicText(content);
    const containerClasses = variant === 'solution' ? 'bg-emerald-50/50 p-6 rounded-lg border-l-4 border-emerald-500 my-6' : 'text-slate-900 leading-relaxed';
    const directionClass = isRTL ? 'text-right' : 'text-justify';
    // Style officiel : Serif (Times)
    const fontClass = 'font-serif'; 

    return (
        <div className={`prose max-w-none ${variant === 'solution' ? 'prose-emerald' : 'prose-slate'} ${fontClass} markdown-math-container ${containerClasses} ${directionClass}`} dir={isRTL ? "rtl" : "ltr"}>
            <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[[rehypeKatex, { strict: false, trust: true, throwOnError: false, output: 'html', macros: { "\\R": "\\mathbb{R}", "\\N": "\\mathbb{N}", "\\Z": "\\mathbb{Z}" } }]]}
                components={{
                    p: ({node, ...props}) => <p className={`mb-3 ${directionClass}`} {...props} />,
                    // Titres de section (Partie I, Partie II...)
                    h1: ({node, ...props}) => <div className="border-b-2 border-black mb-4 pb-1 mt-6"><h3 className="text-lg font-bold uppercase text-black inline-block" {...props} /></div>,
                    h2: ({node, ...props}) => <h4 className="text-base font-bold mt-4 mb-2 text-black underline decoration-1 underline-offset-2" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside my-2 pl-2" {...props} />,
                    li: ({node, ...props}) => <li className="my-1 pl-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-black" {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-black text-sm" {...props} /></div>,
                    th: ({node, ...props}) => <th className="border border-black bg-gray-100 p-2 font-bold text-center" {...props} />,
                    td: ({node, ...props}) => <td className="border border-black p-2" {...props} />,
                }}
            >
                {cleaned}
            </ReactMarkdown>
        </div>
    );
};

// --- EN-TÊTE OFFICIEL EXAMEN NATIONAL ---
const ExamHeader: React.FC<{ options?: ExerciseOptions }> = ({ options }) => {
    const isArabicSubject = ["Arabe", "Education Islamique"].includes(options?.subject || "");
    const schoolName = options?.schoolName || (isArabicSubject ? "الثانوية التأهيلية ..." : "Lycée ...");
    const profName = options?.professorName || (isArabicSubject ? "........" : "........");
    
    // Style commun "Feuille d'examen"
    const containerStyle = "bg-white p-6 md:p-8 mb-8 border border-black font-serif print:mb-6 shadow-sm";

    if (isArabicSubject) {
        return (
            <header className={containerStyle} dir="rtl">
                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                    {/* Partie Droite (Ministère) */}
                    <div className="text-center w-1/3 text-xs md:text-sm font-bold leading-relaxed">
                        <p>المملكة المغربية</p>
                        <p>وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
                        <p className="mt-2">{schoolName}</p>
                    </div>

                    {/* Partie Centrale (Titre Encadré) */}
                    <div className="text-center w-1/3">
                        <div className="border-2 border-black px-4 py-2 inline-block bg-gray-50">
                            <h1 className="text-xl md:text-2xl font-black mb-1">فرض محروس</h1>
                            <p className="text-sm font-bold italic">{options?.subject}</p>
                        </div>
                    </div>

                    {/* Partie Gauche (Infos) */}
                    <div className="text-center w-1/3 text-xs md:text-sm font-bold leading-relaxed">
                        <p>السنة الدراسية: 2024/2025</p>
                        <p>المستوى: {options?.level?.split('-')[0]}</p>
                        <p>الأستاذ: {profName}</p>
                    </div>
                </div>
                {/* Note/Durée */}
                <div className="flex justify-between text-sm font-bold">
                    <span>المدة: ساعة واحدة</span>
                    <span>النقطة: ..... / 20</span>
                </div>
            </header>
        );
    }

    return (
        <header className={containerStyle}>
             <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                {/* Partie Gauche (Ministère) */}
                <div className="text-center w-1/3 text-xs md:text-sm font-bold leading-relaxed uppercase">
                    <p>Royaume du Maroc</p>
                    <p>Ministère de l'Éducation Nationale,</p>
                    <p>du Préscolaire et des Sports</p>
                    <div className="h-px w-1/2 bg-black mx-auto my-1"></div>
                    <p>{schoolName}</p>
                </div>

                {/* Partie Centrale (Titre Encadré) */}
                <div className="text-center w-1/3 mt-2">
                    <div className="border-2 border-black px-2 py-3 inline-block shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white w-full max-w-[220px]">
                        <h1 className="text-xl font-black uppercase tracking-wider mb-0 leading-none">
                            Devoir Surveillé
                        </h1>
                        <p className="text-xs font-bold mt-1 uppercase">
                            {options?.subject}
                        </p>
                    </div>
                </div>

                {/* Partie Droite (Infos) */}
                <div className="text-center w-1/3 text-xs md:text-sm font-bold leading-relaxed">
                    <p>Année Scolaire : 2024/2025</p>
                    <p>Niveau : {options?.level?.split('-')[0]}</p>
                    <p>Pr. {profName}</p>
                </div>
            </div>
            
            <div className="flex justify-between items-center text-sm font-bold px-2">
                <div className="flex gap-4">
                     <span className="border border-black px-3 py-1">Durée : 2h</span>
                     <span className="border border-black px-3 py-1">Coef : ...</span>
                </div>
                <div className="border border-black px-4 py-1 bg-gray-50">
                    Note : ........... / 20
                </div>
            </div>
        </header>
    );
};

export const ExerciseDisplay: React.FC<{ 
    exercise: Exercise; 
    index: number; 
    professorName?: string; 
    options?: ExerciseOptions;
    isStudentMode?: boolean; 
}> = ({ exercise, index, options, isStudentMode = false }) => {
  const [showSolution, setShowSolution] = useState(false);
  const isFirst = index === 0;
  const isArabicSubject = ["Arabe", "Education Islamique"].includes(options?.subject || "");
  const isRTL = isArabicSubject || isArabicText(exercise.title || "");
  const labelExercise = isRTL ? "تمرين" : "Exercice";
  const labelShow = isRTL ? "إظهار التصحيح" : "Voir Corrigé";
  const labelHide = isRTL ? "إخفاء" : "Masquer";
  const labelSolution = isRTL ? "عناصر الإجابة" : "Éléments de réponse";

  return (
    <article className="animate-fade-in-up mb-12 break-inside-avoid max-w-[21cm] mx-auto">
      {isFirst && !isStudentMode && options?.includeOfficialHeader && <ExamHeader options={options} />}

      <div className="relative bg-white md:rounded-sm border border-slate-300 shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
        <header className="bg-slate-50 border-b border-slate-300 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-transparent print:border-none print:px-0 print:pb-0" dir={isRTL ? "rtl" : "ltr"}>
            <div className="flex items-center gap-3">
                <div className="bg-black text-white px-3 py-1 font-serif font-bold text-lg uppercase tracking-wider print:bg-transparent print:text-black print:border print:border-black print:px-2 print:py-0">
                    {labelExercise} {index + 1}
                </div>
                <div className="h-px flex-grow bg-slate-300 w-12 print:hidden"></div>
                <span className="font-serif text-slate-700 italic font-bold text-sm">
                    {exercise.title?.includes('(') ? `(${exercise.title.split('(')[1]}` : ''}
                </span>
            </div>

            {!isStudentMode && (
                <div className="flex items-center gap-2 print:hidden">
                    <button onClick={() => setShowSolution(!showSolution)} className={`group flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded border transition-all ${showSolution ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                        {showSolution ? labelHide : labelShow}
                    </button>
                </div>
            )}
        </header>

        <div className="p-8 bg-white print:p-0 print:pt-4">
            {exercise.illustrationSVG && <SafeSVGDisplay content={exercise.illustrationSVG} />}
            <MarkdownContent content={exercise.enonce} variant="exam" />
        </div>

        {showSolution && !isStudentMode && (
            <section className="border-t border-emerald-200 bg-emerald-50/30 p-6 sm:p-10 animate-fade-in print:bg-transparent print:border-none" dir={isRTL ? "rtl" : "ltr"}>
                <div className="flex items-center gap-3 mb-6 text-emerald-800 font-bold uppercase tracking-widest text-xs border-b border-emerald-200 pb-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-full">✓</span>
                    {labelSolution}
                </div>
                <MarkdownContent content={exercise.corrige} variant="solution" />
            </section>
        )}
      </div>
    </article>
  );
};
