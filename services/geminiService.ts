
import { GoogleGenAI, Type } from "@google/genai";
import type { Exercise, ExerciseOptions, QuizQuestion, QuizAnalysis, SWOTResult } from '../types';
import { supabase } from './supabaseClient';
import { DEFAULT_AI_MODEL, OFFICIAL_EXAM_STRUCTURES } from '../constants';

const getApiKey = () => {
    try {
        if (typeof process !== 'undefined' && process.env) return process.env.API_KEY;
        if (typeof import.meta !== 'undefined' && (import.meta as any).env) return (import.meta as any).env.API_KEY || (import.meta as any).env.VITE_API_KEY;
    } catch (e) { return undefined; }
    return undefined;
};

const API_KEY = getApiKey();
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Mapping pour traduire les options techniques en Arabe dans le prompt
const ARABIC_MAP: Record<string, string> = {
    "Débutant": "تطبيق مباشر (Application)",
    "Intermédiaire": "مستوى الامتحان الوطني (National Exam Level)",
    "Avancé": "تحدي / تميز (Olympiades)",
    "Connaissances": "استرداد المعارف",
    "Application": "تطبيق مباشر",
    "Analyse": "تحليل واستدلال علمي",
    "Synthèse": "تركيب",
    "Compréhension de texte": "فهم المقروء",
    "Expression écrite / Production": "الإنشاء / التعبير الكتابي",
    "Exercice de Grammaire / Conjugaison": "الدرس اللغوي",
    "Analyse littéraire": "تحليل نص أدبي",
    "Analyse de versets coraniques / Hadiths": "تحليل نصوص شرعية",
    "Étude de situation problème": "دراسة وضعية مشكلة"
};

const validateExerciseStructure = (data: any): boolean => {
    if (!Array.isArray(data)) return false;
    return data.every(item => typeof item.enonce === 'string' && typeof item.corrige === 'string');
};

const generateCacheSignature = (options: ExerciseOptions): string => {
    let chapterKey = options.chapter;
    if (options.selectedChapters && options.selectedChapters.length > 0) {
        chapterKey = options.selectedChapters.sort((a, b) => a.chapter.localeCompare(b.chapter)).map(c => `${c.chapter}:${c.count}`).join('|');
    }
    return `${options.level}-${options.subject}-${chapterKey}-${options.difficulty}-${options.type}-${options.objective}-${options.exerciseCount}`.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const generateExercises = async (options: ExerciseOptions, modelName: string = DEFAULT_AI_MODEL): Promise<Exercise[]> => {
  if (supabase) {
      const signature = generateCacheSignature(options);
      try {
          const { data: cachedData } = await supabase.from('exercise_cache').select('content').eq('signature', signature).maybeSingle();
          if (cachedData) return cachedData.content as Exercise[];
      } catch (err) {}
  }

  if (!API_KEY || !ai) throw new Error("Service IA non configuré.");

  const { level, subject, chapter, difficulty, type, selectedChapters } = options;
  
  // Détection de la langue Arabe
  const isArabicSubject = ["Arabe", "Education Islamique"].includes(subject);

  let prompt = "";

  if (isArabicSubject) {
      // --- PROMPT EN ARABE (STYLE OFFICIEL) ---
      let chapterInstruction = `المجال الرئيسي: ${chapter}`;
      if (selectedChapters && selectedChapters.length > 0) {
          chapterInstruction = `توليف بين المجالات التالية: ${selectedChapters.map(c => `${c.chapter}`).join(' + ')}.`;
      }

      const arabicDiff = ARABIC_MAP[difficulty] || difficulty;

      prompt = `
        تقمص دور مفتش تربوي بوزارة التربية الوطنية والتعليم الأولي والرياضة (المغرب).
        المهمة: صياغة موضوع امتحان (فرض محروس أو امتحان موحد) للمستوى: ${level}.
        المادة: ${subject}.
        ${chapterInstruction}
        مستوى الصعوبة: ${arabicDiff}.

        **تعليمات صارمة للشكل والمحتوى (مطابقة للأطر المرجعية المحينة):**
        1. **الهيكلة الرسمية**:
           - يجب أن يحاكي الموضوع ورقة الامتحان الرسمي تماماً.
           - استخدم ترقيماً هرمياً واضحاً (أولاً، 1، أ، ب...).
           - ابدأ دائماً بـ "نص الانطلاق" أو "الوضعية المشكلة" (Sujet de base).
        2. **اللغة والأسلوب**:
           - لغة عربية فصحى سليمة، دقيقة، وخالية من الأخطاء.
           - صياغة الأسئلة بالأفعال السلوكية (حدد، استخرج، بين، ناقش...).
        3. **المكونات (حسب المادة)**:
           - التربية الإسلامية: وضعية دامجة + إسناد (آيات/أحاديث) + أسئلة المداخل الخمسة.
           - اللغة العربية: نص + أسئلة الفهم والتحليل + الدرس اللغوي + التعبير والإنشاء.
        4. **مهم**: لا تذكر اسم المجال أو الفصل في عنوان التمرين أو نصه.

        **تنسيق الإخراج (JSON):**
        [{
           "title": "تمرين [رقم]",
           "enonce": "نص التمرين بتنسيق Markdown (استخدم العناوين ## والخط العريض ** للنصوص الأساسية)...",
           "corrige": "عناصر الإجابة وسلم التنقيط المقترح...",
           "illustrationSVG": null
        }]
      `;
  } else {
      // --- PROMPT EN FRANÇAIS (STYLE OFFICIEL EXAMEN NATIONAL) ---
      let chapterInstruction = `Chapitre(s) ciblé(s) : ${chapter}`;
      if (selectedChapters && selectedChapters.length > 0) {
          chapterInstruction = `SYNTHÈSE MULTI-CHAPITRES (Type Examen National) : ${selectedChapters.map(c => c.chapter).join(' + ')}.`;
      }

      let scienceInstructions = "";
      if (["Physique", "Chimie", "Physique-Chimie", "Mathématiques"].includes(subject)) {
          scienceInstructions = `
          **STRUCTURE OBLIGATOIRE "EXAMEN NATIONAL" :**
          1. **En-tête de l'exercice** : 
             - Titre clair (ex: "Partie I : Étude du mouvement...").
             - **Section "Données"** : Lister toutes les constantes au début (g, M(C), NA...).
          2. **Numérotation Hiérarchique** : 
             - 1. ...
             - 1.1. ...
             - 1.2. ...
          3. **Style** : Impersonnel ("On considère...", "Montrer que...").
          4. **Mathématiques/Formules** : LaTeX OBLIGATOIRE pour toute expression mathématique ($ E = mc^2 $).
          `;
      }

      prompt = `
        Rôle : Inspecteur Pédagogique (Ministère de l'Éducation Nationale - Maroc).
        Tâche : Rédiger un sujet d'examen officiel (Devoir Surveillé ou Examen Blanc) pour le niveau : ${level}.
        Matière : ${subject}.
        ${chapterInstruction}
        Difficulté : ${difficulty}.

        **INSTRUCTIONS DE FORME (STRICTES) :**
        - Le contenu doit respecter scrupuleusement le **Cadre de Référence (Cadre Référentiel)** de l'année en cours.
        - **Mise en page** : Utilise Markdown pour simuler la mise en page officielle (Gras pour les mots clés, Listes pour les données).
        - **Barème** : Indique une estimation des points pour chaque question (ex: (0.5 pt)).
        - **Rigueur** : Aucune ambiguïté dans les questions. Les notations doivent être celles utilisées dans les manuels marocains officiels.
        - **Important** : Ne mentionnez pas le nom du chapitre ou du thème dans le titre de l'exercice ou dans son contenu.

        ${scienceInstructions}

        Format JSON attendu :
        [{
           "title": "Exercice [N]",
           "enonce": "Markdown riche (LaTeX, listes, gras)...",
           "corrige": "Correction détaillée pas à pas avec barème...",
           "illustrationSVG": "<svg>...</svg> (Uniquement si nécessaire pour un circuit ou schéma mécanique)"
        }]
      `;
  }

  const response = await ai.models.generateContent({
        model: modelName, 
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        enonce: { type: Type.STRING },
                        corrige: { type: Type.STRING },
                        illustrationSVG: { type: Type.STRING }
                    },
                    required: ["enonce", "corrige"]
                }
            }
        }
  });

  const parsed = JSON.parse(response.text);
  
  const result = parsed.map((ex: any, i: number) => ({ 
      ...ex, 
      id: ex.id || `gen-${Date.now()}-${i}`, 
      title: ex.title || (isArabicSubject ? `تمرين ${i+1}` : `Exercice ${i+1}`) 
  }));
  
  if (supabase) {
     supabase.from('exercise_cache').insert({ signature: generateCacheSignature(options), content: result }).then(() => {});
  }
  
  return result;
};

// Fonctions Quiz inchangées
export const generateDiagnosticQuiz = async (l: string, s: string, c: string, d: string): Promise<QuizQuestion[]> => {
    if (!ai) throw new Error("IA HS");
    const isArabic = ["Arabe", "Education Islamique"].includes(s);
    const langInstruction = isArabic ? "OUTPUT MUST BE IN ARABIC." : "OUTPUT MUST BE IN FRENCH.";
    
    const p = `Quiz Diagnostic ${l} ${s} sur ${c}. Diff: ${d}. ${langInstruction} JSON: [{question, choices, correctAnswerIndex, explanation, topic}]`;
    const r = await ai.models.generateContent({ model: DEFAULT_AI_MODEL, contents: p, config: { responseMimeType: "application/json" } });
    return JSON.parse(r.text);
};

export const analyzeQuizResults = async (q: QuizQuestion[], a: number[], l: string, s: string): Promise<QuizAnalysis> => {
    if (!ai) throw new Error("IA HS");
    const isArabic = ["Arabe", "Education Islamique"].includes(s);
    const langInstruction = isArabic ? "OUTPUT MUST BE IN ARABIC." : "OUTPUT MUST BE IN FRENCH.";

    const score = a.reduce((acc, v, i) => v === q[i].correctAnswerIndex ? acc + 1 : acc, 0);
    const p = `Analyse résultats quiz ${l} ${s}. Score ${score}/${q.length}. ${langInstruction} JSON: {diagnosis, strengths, weaknesses, revisionPlan: [{topic, action}]}`;
    const r = await ai.models.generateContent({ model: DEFAULT_AI_MODEL, contents: p, config: { responseMimeType: "application/json" } });
    return { score, totalQuestions: q.length, ...JSON.parse(r.text) };
};

export const generateSWOTAnalysis = async (subject: string, context: string): Promise<SWOTResult> => {
    if (!ai) throw new Error("Service IA non configuré ou clé API manquante.");

    const prompt = `
        Agis comme un consultant expert en stratégie éducative et pédagogique.
        Réalise une analyse SWOT (Forces, Faiblesses, Opportunités, Menaces) détaillée pour le sujet suivant : "${subject}".
        Contexte : ${context}.

        Format de sortie attendu (JSON strict) :
        {
            "synthesis": "Synthèse globale en 3 phrases.",
            "strengths": ["Force 1", "Force 2", ...],
            "weaknesses": ["Faiblesse 1", "Faiblesse 2", ...],
            "opportunities": ["Opportunité 1", "Opportunité 2", ...],
            "threats": ["Menace 1", "Menace 2", ...],
            "strategicAdvice": "Un conseil stratégique concret pour s'améliorer."
        }
        
        Si le sujet est en Arabe, réponds en Arabe. Sinon en Français.
    `;

    const response = await ai.models.generateContent({
        model: DEFAULT_AI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    synthesis: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    threats: { type: Type.ARRAY, items: { type: Type.STRING } },
                    strategicAdvice: { type: Type.STRING }
                },
                required: ["synthesis", "strengths", "weaknesses", "opportunities", "threats", "strategicAdvice"]
            }
        }
    });

    return JSON.parse(response.text);
};
