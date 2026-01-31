
/**
 * Prompts MEN (Ministère de l'Éducation Nationale - Maroc)
 * Collection complète de prompts pour générer des exercices conformes au programme marocain
 */

// Mapping pour traduire les options techniques en Arabe dans le prompt
const ARABIC_MAP = {
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

// Prompts pour les matières scientifiques
const SCIENCE_PROMPTS = {
  // Physique
  PHYSIQUE: {
    AR: `
      تقمص دور مفتش تربوي بوزارة التربية الوطنية والتعليم الأولي والرياضة (المغرب).
      المهمة: صياغة موضوع امتحان (فرض محروس أو امتحان موحد) في مادة الفيزياء.
      المستوى: {{LEVEL}}
      المجال: {{CHAPTER}}
      مستوى الصعوبة: {{DIFFICULTY}}
      عدد التمارين: {{EXERCISE_COUNT}}

      **تعليمات صارمة للشكل والمحتوى:**
      1. **الهيكلة الرسمية**:
         - يجب أن يحاكي الموضوع ورقة الامتحان الرسمي تماماً.
         - استخدم ترقيماً هرمياً واضحاً (أولاً، 1، أ، ب...).
         - ابدأ دائماً بقسم "البيانات" الذي يحتوي على جميع الثوابت والمعطيات.
      2. **اللغة والأسلوب**:
         - لغة عربية فصحى سليمة، دقيقة، وخالية من الأخطاء.
         - صياغة الأسئلة بالأفعال السلوكية (حدد، استخرج، بين، ناقش...).
      3. **المحتوى العلمي**:
         - التركيز على المفاهيم الأساسية للمجال المحدد.
         - استخدام الرموز والمعادلات الفيزيائية بشكل صحيح.
         - إضافة تمارين تطبيقية تربط النظرية بالواقع.

      **تنسيق الإخراج (JSON):**
      [{
         "title": "تمرين [رقم]",
         "enonce": "نص التمرين بتنسيق Markdown (استخدم العناوين ## والخط العريض ** للنصوص الأساسية)...",
         "corrige": "عناصر الإجابة وسلم التنقيط المقترح...",
         "illustrationSVG": null
      }]
    `,
    FR: `
      Rôle : Inspecteur Pédagogique (Ministère de l'Éducation Nationale - Maroc).
      Tâche : Rédiger un sujet d'examen officiel (Devoir Surveillé ou Examen Blanc) en Physique.
      Niveau : {{LEVEL}}
      Chapitre : {{CHAPTER}}
      Difficulté : {{DIFFICULTY}}
      Nombre d'exercices : {{EXERCISE_COUNT}}

      **INSTRUCTIONS DE FORME (STRICTES) :**
      1. **STRUCTURE OBLIGATOIRE "EXAMEN NATIONAL" :**
         - **En-tête de l'exercice** : Titre clair (ex: "Partie I : Étude du mouvement...").
         - **Section "Données"** : Lister toutes les constantes au début (g, M(C), NA...).
         - **Numérotation Hiérarchique** : 1. → 1.1. → 1.2.
         - **Style** : Impersonnel ("On considère...", "Montrer que...").
         - **Mathématiques/Formules** : LaTeX OBLIGATOIRE pour toute expression mathématique ($ E = mc^2 $).
      2. **CONTENU SCIENTIFIQUE :**
         - Focus sur les concepts clés du chapitre spécifié.
         - Utilisation correcte des symboles et équations physiques.
         - Exercices d'application reliant théorie et pratique.

      Format JSON attendu :
      [{
         "title": "Exercice [N]",
         "enonce": "Markdown riche (LaTeX, listes, gras)...",
         "corrige": "Correction détaillée pas à pas avec barème...",
         "illustrationSVG": "<svg>...</svg> (Uniquement si nécessaire pour un circuit ou schéma mécanique)"
      }]
    `
  },

  // Chimie
  CHIMIE: {
    AR: `
      تقمص دور مفتش تربوي بوزارة التربية الوطنية والتعليم الأولي والرياضة (المغرب).
      المهمة: صياغة موضوع امتحان (فرض محروس أو امتحان موحد) في مادة الكيمياء.
      المستوى: {{LEVEL}}
      المجال: {{CHAPTER}}
      مستوى الصعوبة: {{DIFFICULTY}}
      عدد التمارين: {{EXERCISE_COUNT}}

      **تعليمات صارمة للشكل والمحتوى:**
      1. **الهيكلة الرسمية**:
         - يجب أن يحاكي الموضوع ورقة الامتحان الرسمي تماماً.
         - استخدم ترقيماً هرمياً واضحاً (أولاً، 1، أ، ب...).
         - ابدأ دائماً بقسم "البيانات" الذي يحتوي على جميع الثوابت والمعطيات.
      2. **اللغة والأسلوب**:
         - لغة عربية فصحى سليمة، دقيقة، وخالية من الأخطاء.
         - صياغة الأسئلة بالأفعال السلوكية (حدد، استخرج، بين، ناقش...).
      3. **المحتوى العلمي**:
         - التركيز على المفاهيم الأساسية للمجال المحدد.
         - استخدام الرموز والمعادلات الكيميائية بشكل صحيح.
         - إضافة تمارين تطبيقية تربط النظرية بالواقع.

      **تنسيق الإخراج (JSON):**
      [{
         "title": "تمرين [رقم]",
         "enonce": "نص التمرين بتنسيق Markdown (استخدم العناوين ## والخط العريض ** للنصوص الأساسية)...",
         "corrige": "عناصر الإجابة وسلم التنقيط المقترح...",
         "illustrationSVG": null
      }]
    `,
    FR: `
      Rôle : Inspecteur Pédagogique (Ministère de l'Éducation Nationale - Maroc).
      Tâche : Rédiger un sujet d'examen officiel (Devoir Surveillé ou Examen Blanc) en Chimie.
      Niveau : {{LEVEL}}
      Chapitre : {{CHAPTER}}
      Difficulté : {{DIFFICULTY}}
      Nombre d'exercices : {{EXERCISE_COUNT}}

      **INSTRUCTIONS DE FORME (STRICTES) :**
      1. **STRUCTURE OBLIGATOIRE "EXAMEN NATIONAL" :**
         - **En-tête de l'exercice** : Titre clair (ex: "Partie I : Réaction chimique...").
         - **Section "Données"** : Lister toutes les constantes au début (M(C), NA...).
         - **Numérotation Hiérarchique** : 1. → 1.1. → 1.2.
         - **Style** : Impersonnel ("On considère...", "Montrer que...").
         - **Mathématiques/Formules** : LaTeX OBLIGATOIRE pour toute expression mathématique ($ E = mc^2 $).
      2. **CONTENU SCIENTIFIQUE :**
         - Focus sur les concepts clés du chapitre spécifié.
         - Utilisation correcte des symboles et équations chimiques.
         - Exercices d'application reliant théorie et pratique.

      Format JSON attendu :
      [{
         "title": "Exercice [N]",
         "enonce": "Markdown riche (LaTeX, listes, gras)...",
         "corrige": "Correction détaillée pas à pas avec barème...",
         "illustrationSVG": "<svg>...</svg> (Uniquement si nécessaire pour un schéma moléculaire)"
      }]
    `
  },

  // SVT
  SVT: {
    AR: `
      تقمص دور مفتش تربوي بوزارة التربية الوطنية والتعليم الأولي والرياضة (المغرب).
      المهمة: صياغة موضوع امتحان (فرض محروس أو امتحان موحد) في مادة علوم الحياة والأرض.
      المستوى: {{LEVEL}}
      المجال: {{CHAPTER}}
      مستوى الصعوبة: {{DIFFICULTY}}
      عدد التمارين: {{EXERCISE_COUNT}}

      **تعليمات صارمة للشكل والمحتوى:**
      1. **الهيكلة الرسمية**:
         - يجب أن يحاكي الموضوع ورقة الامتحان الرسمي تماماً.
         - استخدم ترقيماً هرمياً واضحاً (أولاً، 1، أ، ب...).
         - ابدأ دائماً بقسم "البيانات" الذي يحتوي على جميع المعطيات.
      2. **اللغة والأسلوب**:
         - لغة عربية فصحى سليمة، دقيقة، وخالية من الأخطاء.
         - صياغة الأسئلة بالأفعال السلوكية (حدد، استخرج، بين، ناقش...).
      3. **المحتوى العلمي**:
         - التركيز على المفاهيم الأساسية للمجال المحدد.
         - استخدام المصطلحات العلمية بشكل صحيح.
         - إضافة تمارين تطبيقية تربط النظرية بالواقع.

      **تنسيق الإخراج (JSON):**
      [{
         "title": "تمرين [رقم]",
         "enonce": "نص التمرين بتنسيق Markdown (استخدم العناوين ## والخط العريض ** للنصوص الأساسية)...",
         "corrige": "عناصر الإجابة وسلم التنقيط المقترح...",
         "illustrationSVG": null
      }]
    `,
    FR: `
      Rôle : Inspecteur Pédagogique (Ministère de l'Éducation Nationale - Maroc).
      Tâche : Rédiger un sujet d'examen officiel (Devoir Surveillé ou Examen Blanc) en SVT.
      Niveau : {{LEVEL}}
      Chapitre : {{CHAPTER}}
      Difficulté : {{DIFFICULTY}}
      Nombre d'exercices : {{EXERCISE_COUNT}}

      **INSTRUCTIONS DE FORME (STRICTES) :**
      1. **STRUCTURE OBLIGATOIRE "EXAMEN NATIONAL" :**
         - **En-tête de l'exercice** : Titre clair (ex: "Partie I : Digestion et absorption...").
         - **Numérotation Hiérarchique** : 1. → 1.1. → 1.2.
         - **Style** : Impersonnel ("On considère...", "Montrer que...").
      2. **CONTENU SCIENTIFIQUE :**
         - Focus sur les concepts clés du chapitre spécifié.
         - Utilisation correcte des terminologies scientifiques.
         - Exercices d'application reliant théorie et pratique.

      Format JSON attendu :
      [{
         "title": "Exercice [N]",
         "enonce": "Markdown riche (listes, gras)...",
         "corrige": "Correction détaillée pas à pas avec barème...",
         "illustrationSVG": "<svg>...</svg> (Uniquement si nécessaire pour un schéma biologique)"
      }]
    `
  }
};

// Prompts pour les matières littéraires
const LITERARY_PROMPTS = {
  // Arabe
  ARABE: {
    AR: `
      تقمص دور مفتش تربوي بوزارة التربية الوطنية والتعليم الأولي والرياضة (المغرب).
      المهمة: صياغة موضوع امتحان (فرض محروس أو امتحان موحد) في مادة اللغة العربية.
      المستوى: {{LEVEL}}
      المجال: {{CHAPTER}}
      مستوى الصعوبة: {{DIFFICULTY}}
      عدد التمارين: {{EXERCISE_COUNT}}

      **تعليمات صارمة للشكل والمحتوى:**
      1. **الهيكلة الرسمية**:
         - يجب أن يحاكي الموضوع ورقة الامتحان الرسمي تماماً.
         - استخدم ترقيماً هرمياً واضحاً (أولاً، 1، أ، ب...).
         - ابدأ دائماً بـ "نص الانطلاق" أو "الوضعية المشكلة" (Sujet de base).
      2. **اللغة والأسلوب**:
         - لغة عربية فصحى سليمة، دقيقة، وخالية من الأخطاء.
         - صياغة الأسئلة بالأفعال السلوكية (حدد، استخرج، بين، ناقش...).
      3. **المكونات**:
         - نص + أسئلة الفهم والتحليل + الدرس اللغوي + التعبير والإنشاء.

      **تنسيق الإخراج (JSON):**
      [{
         "title": "تمرين [رقم]",
         "enonce": "نص التمرين بتنسيق Markdown (استخدم العناوين ## والخط العريض ** للنصوص الأساسية)...",
         "corrige": "عناصر الإجابة وسلم التنقيط المقترح...",
         "illustrationSVG": null
      }]
    `,
    FR: `
      Rôle : Inspecteur Pédagogique (Ministère de l'Éducation Nationale - Maroc).
      Tâche : Rédiger un sujet d'examen officiel (Devoir Surveillé ou Examen Blanc) en Arabe.
      Niveau : {{LEVEL}}
      Chapitre : {{CHAPTER}}
      Difficulté : {{DIFFICULTY}}
      Nombre d'exercices : {{EXERCISE_COUNT}}

      **INSTRUCTIONS DE FORME (STRICTES) :**
      1. **STRUCTURE OBLIGATOIRE "EXAMEN NATIONAL" :**
         - **En-tête de l'exercice** : Titre clair.
         - **Numérotation Hiérarchique** : 1. → 1.1. → 1.2.
      2. **CONTENU**:
         - Texte + questions de compréhension et d'analyse + leçon linguistique + expression et création.

      Format JSON attendu :
      [{
         "title": "Exercice [N]",
         "enonce": "Markdown riche (listes, gras)...",
         "corrige": "Correction détaillée pas à pas avec barème...",
         "illustrationSVG": null
      }]
    `
  },

  // Français
  FRANCAIS: {
    FR: `
      Rôle : Inspecteur Pédagogique (Ministère de l'Éducation Nationale - Maroc).
      Tâche : Rédiger un sujet d'examen officiel (Devoir Surveillé ou Examen Blanc) en Français.
      Niveau : {{LEVEL}}
      Chapitre : {{CHAPTER}}
      Difficulté : {{DIFFICULTY}}
      Nombre d'exercices : {{EXERCISE_COUNT}}

      **INSTRUCTIONS DE FORME (STRICTES) :**
      1. **STRUCTURE OBLIGATOIRE "EXAMEN NATIONAL" :**
         - **En-tête de l'exercice** : Titre clair.
         - **Numérotation Hiérarchique** : 1. → 1.1. → 1.2.
      2. **CONTENU**:
         - Texte + questions de compréhension et d'analyse + grammaire/conjugaison + production écrite.

      Format JSON attendu :
      [{
         "title": "Exercice [N]",
         "enonce": "Markdown riche (listes, gras)...",
         "corrige": "Correction détaillée pas à pas avec barème...",
         "illustrationSVG": null
      }]
    `
  }
};

// Prompts pour les matières religieuses
const RELIGIOUS_PROMPTS = {
  // Éducation Islamique
  EDUCATION_ISLAMIQUE: {
    AR: `
      تقمص دور مفتش تربوي بوزارة التربية الوطنية والتعليم الأولي والرياضة (المغرب).
      المهمة: صياغة موضوع امتحان (فرض محروس أو امتحان موحد) في مادة التربية الإسلامية.
      المستوى: {{LEVEL}}
      المجال: {{CHAPTER}}
      مستوى الصعوبة: {{DIFFICULTY}}
      عدد التمارين: {{EXERCISE_COUNT}}

      **تعليمات صارمة للشكل والمحتوى:**
      1. **الهيكلة الرسمية**:
         - يجب أن يحاكي الموضوع ورقة الامتحان الرسمي تماماً.
         - استخدم ترقيماً هرمياً واضحاً (أولاً، 1، أ، ب...).
         - ابدأ دائماً بـ "نص الانطلاق" أو "الوضعية المشكلة" (Sujet de base).
      2. **اللغة والأسلوب**:
         - لغة عربية فصحى سليمة، دقيقة، وخالية من الأخطاء.
         - صياغة الأسئلة بالأفعال السلوكية (حدد، استخرج، بين، ناقش...).
      3. **المكونات**:
         - وضعية دامجة + إسناد (آيات/أحاديث) + أسئلة المداخل الخمسة.

      **تنسيق الإخراج (JSON):**
      [{
         "title": "تمرين [رقم]",
         "enonce": "نص التمرين بتنسيق Markdown (استخدم العناوين ## والخط العريض ** للنصوص الأساسية)...",
         "corrige": "عناصر الإجابة وسلم التنقيط المقترح...",
         "illustrationSVG": null
      }]
    `,
    FR: `
      Rôle : Inspecteur Pédagogique (Ministère de l'Éducation Nationale - Maroc).
      Tâche : Rédiger un sujet d'examen officiel (Devoir Surveillé ou Examen Blanc) en Éducation Islamique.
      Niveau : {{LEVEL}}
      Chapitre : {{CHAPTER}}
      Difficulté : {{DIFFICULTY}}
      Nombre d'exercices : {{EXERCISE_COUNT}}

      **INSTRUCTIONS DE FORME (STRICTES) :**
      1. **STRUCTURE OBLIGATOIRE "EXAMEN NATIONAL" :**
         - **En-tête de l'exercice** : Titre clair.
         - **Numérotation Hiérarchique** : 1. → 1.1. → 1.2.
      2. **CONTENU**:
         - Situation intégrante + sources (versets/hadiths) + questions des cinq entrées.

      Format JSON attendu :
      [{
         "title": "Exercice [N]",
         "enonce": "Markdown riche (listes, gras)...",
         "corrige": "Correction détaillée pas à pas avec barème...",
         "illustrationSVG": null
      }]
    `
  }
};

// Fonction pour construire un prompt dynamique
function promptBuilder(options) {
  const { level, subject, chapter, difficulty, language, exerciseCount, includeInstructions = true, customInstructions = '' } = options;

  // Détermination du type de prompt à utiliser
  let promptTemplate = '';
  const isArabic = language === 'ar';
  const arabicDiff = ARABIC_MAP[difficulty] || difficulty;

  // Sélection du template approprié
  if (['Physique', 'Chimie', 'Physique-Chimie', 'Mathématiques'].includes(subject)) {
    promptTemplate = isArabic ? SCIENCE_PROMPTS.PHYSIQUE.AR : SCIENCE_PROMPTS.PHYSIQUE.FR;
  } else if (['SVT'].includes(subject)) {
    promptTemplate = isArabic ? SCIENCE_PROMPTS.SVT.AR : SCIENCE_PROMPTS.SVT.FR;
  } else if (['Arabe'].includes(subject)) {
    promptTemplate = isArabic ? LITERARY_PROMPTS.ARABE.AR : LITERARY_PROMPTS.ARABE.FR;
  } else if (['Français'].includes(subject)) {
    promptTemplate = LITERARY_PROMPTS.FRANCAIS.FR;
  } else if (['Education Islamique'].includes(subject)) {
    promptTemplate = isArabic ? RELIGIOUS_PROMPTS.EDUCATION_ISLAMIQUE.AR : RELIGIOUS_PROMPTS.EDUCATION_ISLAMIQUE.FR;
  } else {
    // Template par défaut
    promptTemplate = isArabic ? SCIENCE_PROMPTS.PHYSIQUE.AR : SCIENCE_PROMPTS.PHYSIQUE.FR;
  }

  // Remplacement des variables dans le template
  let prompt = promptTemplate
    .replace(/\{\{LEVEL\}\}/g, level)
    .replace(/\{\{CHAPTER\}\}/g, chapter)
    .replace(/\{\{DIFFICULTY\}\}/g, arabicDiff)
    .replace(/\{\{EXERCISE_COUNT\}\}/g, exerciseCount.toString());

  // Ajout d'instructions personnalisées si fournies
  if (customInstructions) {
    prompt += `\n\n**INSTRUCTIONS PERSONNALISÉES:**\n${customInstructions}`;
  }

  return {
    prompt,
    metadata: {
      level,
      subject,
      chapter,
      difficulty,
      language,
      exerciseCount
    }
  };
}

// Export des prompts et fonctions
module.exports = {
  SCIENCE_PROMPTS,
  LITERARY_PROMPTS,
  RELIGIOUS_PROMPTS,
  ARABIC_MAP,
  promptBuilder
};
