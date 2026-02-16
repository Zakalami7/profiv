
import type { Curriculum, ExerciseOptions, RateLimits, OfficialExamStructure } from './types';

// Programme par défaut (Fallback si Supabase offline)
export const CURRICULUM: Curriculum = {
  // --- CYCLE PRIMAIRE ---
  "Primaire (1ère Année)": {
    "Mathématiques": ["Nombres de 0 à 30", "Addition sans retenue", "Comparaison et ordre", "Géométrie : Formes simples", "Se repérer dans l'espace", "Remédiation TaRL : Reconnaissance des nombres"],
    "Arabe": ["Lecture : Sons et Lettres", "Écriture : Lettres isolées", "Expression orale", "Remédiation TaRL : Niveau Lettre"],
    "Français": ["Activités orales", "Graphisme", "Comptines", "Vocabulaire : École et Famille"],
    "Activité Scientifique": ["Les sens", "Le mouvement", "L'alimentation", "L'eau et la nature"],
    "Education Islamique": ["Sourate Al-Fatiha", "Sourate Al-Ikhlas", "Piliers de l'Islam (Introduction)"]
  },
  "Primaire (2ème Année)": {
    "Mathématiques": ["Nombres de 0 à 999", "Addition avec retenue", "Soustraction sans retenue", "Multiplication (Introduction)", "Mesure du temps", "Remédiation TaRL : Opérations de base"],
    "Arabe": ["Lecture fluide", "Dictée", "Grammaire intuitive", "Remédiation TaRL : Niveau Mot"],
    "Français": ["Lecture : Mots et phrases simples", "Écriture cursive", "Vocabulaire thématique", "Remédiation TaRL : Décodage"],
    "Activité Scientifique": ["Les états de la matière", "Le monde vivant", "Électricité simple"],
    "Education Islamique": ["Sourate Al-Fil", "Sourate Quraïch", "La prière"]
  },
  "Primaire (3ème Année)": {
    "Mathématiques": ["Nombres jusqu'à 9999", "Soustraction avec retenue", "Multiplication (Technique)", "Division (Approche)", "Géométrie : Angles et droites", "Mesure de masses"],
    "Arabe": ["Lecture courante", "Conjugaison (Passé/Présent)", "Orthographe", "Remédiation TaRL : Niveau Paragraphe"],
    "Français": ["Lecture compréhensive", "Grammaire : Phrase, Nom, Verbe", "Conjugaison : Présent (Verbes usuels)", "Production écrite simple"],
    "Activité Scientifique": ["Propriétés de la matière", "Le cycle de vie des animaux", "Respiration"],
    "Education Islamique": ["Sourate Al-Ala", "La foi", "Comportement"]
  },
  "Primaire (4ème Année)": {
    "Mathématiques": ["Grands nombres", "Division euclidienne", "Nombres décimaux", "Aires et périmètres", "Fractions (Introduction)", "Remédiation TaRL : Division/Fractions"],
    "Arabe": ["Grammaire : Phrase nominale/verbale", "Conjugaison : Impératif", "Orthographe : Hamza", "Expression écrite : Récit"],
    "Français": ["Lecture : Textes narratifs/informatifs", "Grammaire : Les déterminants, Adjectifs", "Conjugaison : Futur, Imparfait", "Orthographe : Accord", "Remédiation TaRL : Compréhension"],
    "Activité Scientifique": ["Classification des vivants", "Chaleur et température", "Circuit électrique simple"],
    "Histoire-Géo": ["Histoire locale", "Mon environnement géographique"]
  },
  "Primaire (5ème Année)": {
    "Mathématiques": ["Opérations sur décimaux", "Fractions (Calcul)", "Proportionnalité", "Unités de mesure (Aire/Volume)", "Géométrie : Cercles et disques"],
    "Arabe": ["Grammaire avancée (Kan wa akhawatuha)", "Analyse de texte", "Production écrite structurée"],
    "Français": ["Lecture : Texte explicatif/descriptif", "Grammaire : COD/COI", "Conjugaison : Passé composé", "Production écrite : 5-7 lignes"],
    "Activité Scientifique": ["Énergie", "Reproduction chez les plantes", "Mouvement et force"],
    "Histoire-Géo": ["Le Maroc ancien", "Carte du Maroc", "Relief et Climat"]
  },
  "Primaire (6ème Année)": {
    "Mathématiques": ["Nombres réels", "Proportionnalité (Vitesse, Pourcentage)", "Géométrie dans l'espace (Volumes)", "Statistiques", "Calcul d'aires complexes", "Préparation Examen Normalisé"],
    "Arabe": ["Synthèse grammaticale", "Étude de texte complète", "Expression écrite (Argumentation simple)", "Préparation Examen Normalisé"],
    "Français": ["Lecture : Tous types de textes", "Grammaire/Conjugaison (Synthèse)", "Voix active/passive", "Discours direct/indirect", "Production écrite : Récit/Lettre"],
    "Activité Scientifique": ["Environnement et Écologie", "Astronomie", "Électricité domestique"],
    "Education Islamique": ["Sourate Al-Mulk", "Sira : La mission", "Valeurs citoyennes"]
  },

  // --- COLLÈGE (Mise à jour Programme Officiel BIOF) ---
  "Collège (1ère Année)": {
    "Physique-Chimie": [
        "L'eau dans notre environnement", 
        "Les trois états de la matière", 
        "Volume et Masse", 
        "Masse volumique", 
        "Pression et Pression atmosphérique", 
        "Modèle particulaire de la matière", 
        "Chaleur et changements d'état", 
        "Mélanges (Homogènes/Hétérogènes)", 
        "Dissolution", 
        "Séparation des constituants d'un mélange", 
        "Le corps pur", 
        "Le circuit électrique simple", 
        "Conducteurs et isolants", 
        "Montage en série et en dérivation", 
        "Le courant électrique continu", 
        "L'installation électrique domestique"
    ],
    "Mathématiques": ["Opérations sur les nombres entiers et décimaux", "Fractions", "Nombres relatifs", "Développement et Factorisation", "Équations", "Angles", "Triangles", "Symétrie centrale", "Parallélogramme", "Quadrilatères particuliers", "Cercle", "Prisme droit et Cylindre", "Proportionnalité", "Statistiques"],
    "SVT": ["Découverte du milieu naturel", "La respiration dans différents milieux", "L'alimentation chez les êtres vivants", "Les chaînes alimentaires", "Classification des êtres vivants", "Les phénomènes géologiques externes"],
    "Français": ["Le conte", "La description", "Langue et Grammaire", "Communication", "Production écrite"],
    "Arabe": ["Lecture méthodique", "Langue", "Expression écrite", "Textes fonctionnels"],
    "Anglais": ["Greetings & Introductions", "Family & Friends", "School & Daily Routine", "Hobbies", "Grammar Basics"],
    "Histoire-Géo": ["Civilisations anciennes", "Le Maroc ancien", "Géographie générale", "Éducation à la citoyenneté"],
    "Education Islamique": ["Sourate Al-Qalam", "Foi et Croyance", "Sira Prophétique", "Adab et Morale"]
  },
  "Collège (2ème Année)": {
    "Physique-Chimie": [
        "L'air qui nous entoure", 
        "Propriétés de l'air", 
        "Atomes et molécules", 
        "Réaction chimique", 
        "Lois de la réaction chimique", 
        "Combustions", 
        "Réactions de quelques métaux avec l'air", 
        "Lumière et sources lumineuses", 
        "Propagation rectiligne de la lumière", 
        "Les ombres", 
        "L'éclipse", 
        "Lentilles minces", 
        "Image formée par une lentille", 
        "Le courant électrique alternatif sinusoïdal"
    ],
    "Mathématiques": ["Nombres rationnels (Opérations)", "Puissances", "Calcul littéral", "Équations", "Ordre et opérations", "Symétrie axiale", "Triangle rectangle et cercle", "Vecteurs et Translation", "Pyramide et Cône", "Statistiques"],
    "SVT": ["La théorie de la tectonique des plaques", "Les séismes", "Le volcanisme", "Formation des roches magmatiques", "La déformation tectonique", "La formation des chaînes de montagnes", "La reproduction chez les animaux", "La reproduction chez les végétaux"],
    "Français": ["Le théâtre", "Le journal scolaire", "Les médias", "Langue et communication"],
    "Arabe": ["Textes littéraires", "Grammaire et Conjugaison", "Expression et Création"],
    "Anglais": ["Health & Body", "Food & Drink", "Clothes & Fashion", "Past Simple", "Future forms"],
    "Histoire-Géo": ["L'Islam et l'Occident", "Le Maroc médiéval", "Le Maghreb", "Institutions constitutionnelles"],
    "Education Islamique": ["Sourate Al-Hujurat", "Les piliers de l'Islam", "Valeurs sociales"]
  },
  "Collège (3ème Année)": {
    "Physique-Chimie": [
        "Exemples de quelques matériaux", 
        "Atomes et ions", 
        "Action de l'air sur quelques matériaux", 
        "Solutions acides et basiques", 
        "Action des solutions acides/basiques sur les métaux", 
        "Tests de reconnaissance des ions", 
        "Le mouvement et le repos", 
        "La vitesse moyenne", 
        "Actions mécaniques - Forces", 
        "Équilibre d'un corps soumis à deux forces", 
        "Poids et masse", 
        "La loi d'Ohm", 
        "Puissance électrique", 
        "Énergie électrique"
    ],
    "Mathématiques": ["Racines carrées", "Identités remarquables", "Puissances", "Théorème de Thalès", "Théorème de Pythagore", "Trigonométrie", "Angles inscrits", "Triangles semblables", "Ordre et inéquations", "Vecteurs et translation", "Repère dans le plan", "Équation d'une droite", "Systèmes d'équations", "Fonctions linéaires et affines", "Statistique", "Géométrie dans l'espace"],
    "SVT": ["Digestion et absorption", "Éducation nutritionnelle", "Respiration", "Sang et circulation", "Excrétion urinaire", "Système nerveux", "Système musculaire", "Immunité (Microbes/Défenses)", "Dysfonctionnement du système immunitaire", "Transfusion sanguine"],
    "Français": ["La nouvelle policière", "Le récit de vie", "La correspondance", "Langue et figures de style"],
    "Arabe": ["Lecture", "Leçon de langue", "Expression écrite (Récit, Description)"],
    "Anglais": ["Talents & Qualities", "Opportunities", "Environment", "Technology", "Grammar Review"],
    "Histoire-Géo": ["Guerres mondiales", "Maroc sous protectorat", "États-Unis / Japon / Russie", "Environnement"],
    "Education Islamique": ["Sourate Al-Hadid", "Le Prophète modèle", "Famille et société"]
  },

  // --- LYCÉE (Mise à jour Programme Officiel) ---
  "Tronc Commun Scientifique": {
    "Physique-Chimie": [
        "Gravitation universelle", 
        "Exemples d'actions mécaniques", 
        "Le mouvement", 
        "Principe d'inertie", 
        "Équilibre d'un corps solide", 
        "Espèces chimiques", 
        "Extraction, séparation et identification", 
        "Synthèse d'espèces chimiques", 
        "Modèle de l'atome", 
        "Géométrie de quelques molécules", 
        "Classification périodique", 
        "La mole et la quantité de matière", 
        "La concentration molaire", 
        "Transformation chimique", 
        "Courant électrique continu (Lycée)", 
        "Tension électrique (Lycée)", 
        "Associations de conducteurs ohmiques", 
        "Caractéristiques de quelques dipôles passifs", 
        "Caractéristique d'un dipôle actif"
    ],
    "Mathématiques": ["Arithmétique dans IN", "Calcul vectoriel", "Projection", "Ensemble des nombres réels", "Ordre dans IR", "Polynômes", "Équations et inéquations", "Trigonométrie 1", "Statistiques", "Fonctions numériques", "Transformations du plan", "Produit scalaire", "Géométrie dans l'espace"],
    "SVT": ["Écologie : Sortie écologique", "Facteurs édaphiques", "Facteurs climatiques", "Flux de la matière et de l'énergie", "Équilibres naturels", "Reproduction sexuée chez les plantes", "Reproduction asexuée"],
    "Français": ["La typologie textuelle", "La nouvelle réaliste", "La nouvelle fantastique", "Le théâtre comique"],
    "Arabe": ["Discours publicitaire", "Discours de presse", "Discours politique", "Poésie ancienne"],
    "Anglais": ["Education", "Cultural Issues", "Media", "Environment", "Health and Welfare"],
    "Histoire-Géo": ["Le monde musulman", "L'Europe moderne", "Le Maroc moderne", "Géographie rurale et urbaine"],
    "Philosophie": ["La Philosophie (Origines)", "Nature et Culture", "L'Homme"],
    "Informatique": ["Généralités", "Logiciels", "Algorithmique", "Programmation (Python)"]
  },
  "1ère Année Bac - Sciences Expérimentales": {
    "Physique-Chimie": [
        "Mouvement de rotation d'un corps solide", 
        "Travail et puissance d'une force", 
        "Travail et énergie cinétique", 
        "Travail et énergie potentielle de pesanteur", 
        "Énergie mécanique", 
        "Transfert d'énergie thermique", 
        "Champ électrostatique", 
        "Énergie potentielle électrostatique", 
        "Transfert d'énergie : Circuit électrique", 
        "Champ magnétique", 
        "Champ magnétique créé par un courant", 
        "Forces électromagnétiques", 
        "Mesure de la quantité de matière", 
        "Concentration et solutions électrolytiques", 
        "Suivi d'une transformation chimique", 
        "Conductance et conductivité", 
        "Réactions acido-basiques", 
        "Réactions d'oxydoréduction", 
        "Dosages directs", 
        "Chimie organique : Squelettes carbonés", 
        "Groupes caractéristiques"
    ],
    "Mathématiques": ["Logique mathématique", "Généralités sur les fonctions", "Barycentre", "Suites numériques", "Produit scalaire", "Calcul trigonométrique", "Rotation dans le plan", "Limites d'une fonction", "Dérivabilité", "Étude de fonctions", "Vecteurs dans l'espace", "Géométrie analytique espace"],
    "SVT": ["Réalisation de la carte paléogéographique", "Reconstitution de l'histoire géologique", "Production de la matière organique", "Communication hormonale", "Communication nerveuse", "L'immunité", "Disfonctionnement du système immunitaire", "Transfusion sanguine"],
    "Français": ["Le roman à thèse (Le dernier jour d'un condamné)", "La tragédie moderne (Antigone)", "Le roman maghrébin (La Boîte à Merveilles)"],
    "Arabe": ["Discours (Publicité, Presse, Politique)", "Concepts (Modernité, Communication, Création)", "Poésie"],
    "Anglais": ["Education", "Culture", "Leisure", "Media", "Citizenship"],
    "Histoire-Géo": ["Transformations du monde capitaliste", "Le Maroc colonial", "Le monde arabe", "L'Amérique et la Chine"],
    "Education Islamique": ["Sourate Youssef", "Foi et Invisibilité", "Droit de la famille (Mariage/Divorce)"],
    "Philosophie": ["La conscience", "Le désir", "La société", "Le langage"]
  },
  "2ème Année Bac - Sciences Physiques / SVT": {
    "Physique": [
        "Ondes mécaniques progressives", 
        "Ondes mécaniques progressives périodiques", 
        "Propagation d'une onde lumineuse", 
        "Décroissance radioactive", 
        "Noyaux, masse et énergie", 
        "Dipôle RC", 
        "Dipôle RL", 
        "Oscillations libres dans un circuit RLC série", 
        "Modulation d'amplitude", 
        "Lois de Newton", 
        "Chute verticale d'un solide", 
        "Mouvements plans", 
        "Satellites et planètes", 
        "Rotation autour d'un axe fixe", 
        "Systèmes oscillants (Pendules)", 
        "Aspect énergétique des oscillations", 
        "Atome et mécanique de Newton"
    ],
    "Chimie": [
        "Transformations lentes et rapides", 
        "Suivi temporel d'une transformation", 
        "Transformations chimiques s'effectuant dans les deux sens", 
        "État d'équilibre d'un système chimique", 
        "Transformations liées à des réactions acide-base", 
        "Évolution spontanée d'un système chimique", 
        "Transformations spontanées dans les piles", 
        "Transformations forcées (Électrolyse)", 
        "Réactions d'estérification et d'hydrolyse", 
        "Contrôle de l'évolution d'un système chimique"
    ],
    "Mathématiques": ["Limites et continuité", "Dérivabilité", "Suites numériques", "Fonctions logarithmes", "Nombres complexes 1", "Fonctions exponentielles", "Nombres complexes 2", "Calcul intégral", "Équations différentielles", "Probabilités", "Géométrie dans l'espace (Produit vectoriel)"],
    "SVT": ["Consommation de la matière organique et flux d'énergie", "Information génétique (Nature et Expression)", "Génie génétique", "Hérédité humaine", "Génétique des populations", "Immunologie"],
    "Anglais": ["Formal/Non-formal Education", "Cultural Values", "Gifts of Youth", "Advances in Technology", "Women and Power", "Brain Drain", "Humour", "Citizenship", "Sustainable Development", "International Organizations"],
    "Philosophie": ["La Condition Humaine (Personne, Autrui)", "La Connaissance (Théorie/Expérience, Vérité)", "La Politique (État, Justice)", "La Morale (Devoir, Bonheur)"],
    "Arabe": ["Texte littéraire (Poésie, Prose)", "Texte théorique", "Critique littéraire"]
  }
};

// --- CADRES RÉFÉRENTIELS OFFICIELS (BAC MAROC & PRIMAIRE) ---
export const OFFICIAL_EXAM_STRUCTURES: Record<string, OfficialExamStructure> = {
    "SVT": {
        components: [
            { name: "Partie I : Restitution des connaissances", weight: "5 points (25%)", description: "QCM, Vrai/Faux, Définitions, Schémas à légender." },
            { name: "Partie II : Raisonnement scientifique", weight: "15 points (75%)", description: "Exploitation de documents, Analyse de graphiques, Synthèse." }
        ],
        guidelines: ["Interdiction de la calculatrice programmable.", "Respecter la notation scientifique."]
    },
    "Physique-Chimie": {
        components: [
            { name: "Chimie", weight: "7 points", description: "Généralement deux parties indépendantes (ex: Cinétique + Acide/Base)." },
            { name: "Physique", weight: "13 points", description: "Exercice 1 (Ondes/Nucléaire), Exercice 2 (Électricité), Exercice 3 (Mécanique)." }
        ],
        guidelines: ["Les applications numériques doivent être précédées de l'expression littérale.", "Respecter le nombre de chiffres significatifs."]
    },
    "Mathématiques": {
        components: [
            { name: "Exercice 1", weight: "3-4 points", description: "Géométrie dans l'espace ou Probabilités." },
            { name: "Exercice 2", weight: "3-4 points", description: "Nombres Complexes." },
            { name: "Problème d'Analyse", weight: "11-12 points", description: "Étude de fonction (Ln/Exp), Intégrale, Suite liée à la fonction." }
        ],
        guidelines: ["La clarté du raisonnement est primordiale."]
    },
    "Primaire (6ème Année)": {
        components: [
            { name: "Activités Numériques", weight: "10 points", description: "Opérations (x, :, +, -), Fractions, Proportionnalité." },
            { name: "Activités Géométriques", weight: "10 points", description: "Construction angles/figures, Symétrie, Aires/Périmètres." },
            { name: "Mesure", weight: "10 points", description: "Conversions (Longueur, Masse, Capacité, Volume) et problèmes." },
            { name: "Organisation de données", weight: "10 points", description: "Lecture de graphiques, tableaux." }
        ],
        guidelines: ["Les étapes de calcul doivent être visibles.", "Soigner la présentation."]
    }
};

export const DIFFICULTIES = ["Débutant", "Intermédiaire", "Avancé"];

// TYPES D'EXERCICES ADAPTATIFS PAR MATIÈRE
const MATH_TYPES = [
    "Exercice de calcul direct",
    "Problème ouvert",
    "Démonstration mathématique",
    "Vrai ou Faux (avec justification)",
    "Étude de cas / Problème concret",
    "Géométrie et Construction"
];

const SCIENCES_TYPES = [
    "Restitution des connaissances (Définitions/Schémas)",
    "Exercice d'application directe",
    "Résolution de problème scientifique",
    "Analyse de documents / Graphes",
    "Interprétation d'expérience",
    "Schéma à légender"
];

const LANGUAGES_TYPES = [
    "Compréhension de texte",
    "Expression écrite / Production",
    "Exercice de Grammaire / Conjugaison",
    "Analyse littéraire",
    "Remédiation (TaRL - Dictée/Lecture)",
    "Traduction / Version (Anglais)"
];

const HUMANITIES_TYPES = [
    "Analyse de document (Carte, Texte, Graphique)",
    "Dissertation / Sujet de réflexion",
    "Définition de concepts",
    "Chronologie / Frise"
];

const ISLAMIC_TYPES = [
    "Analyse de versets coraniques / Hadiths",
    "Étude de situation problème",
    "Définition et Terminologie",
    "Synthèse de valeurs"
];

const CS_TYPES = [
    "Écriture d'algorithme / Code",
    "Analyse de programme",
    "Schéma logique / Binaire"
];

// MAPPING DES TYPES PAR MATIÈRE
export const SUBJECT_TYPE_MAPPING: Record<string, string[]> = {
    "Mathématiques": MATH_TYPES,
    "Physique": SCIENCES_TYPES,
    "Chimie": SCIENCES_TYPES,
    "Physique-Chimie": SCIENCES_TYPES,
    "SVT": SCIENCES_TYPES,
    "Activité Scientifique": SCIENCES_TYPES,
    "Français": LANGUAGES_TYPES,
    "Anglais": LANGUAGES_TYPES,
    "Arabe": LANGUAGES_TYPES,
    "Philosophie": HUMANITIES_TYPES,
    "Histoire-Géo": HUMANITIES_TYPES,
    "Education Islamique": ISLAMIC_TYPES,
    "Informatique": CS_TYPES,
    "DEFAULT": [
        "Question à choix multiple (QCM)", 
        "Exercice à développer", 
        "Problème pratique", 
        "Analyse de cas"
    ]
};

// EXPORT COMPATIBLE POUR L'INITIALISATION
export const EXERCISE_TYPES = SUBJECT_TYPE_MAPPING["DEFAULT"];

export const OBJECTIVES = ["Connaissances", "Application", "Analyse", "Synthèse", "Raisonnement scientifique", "Expression écrite", "Compréhension orale/écrite", "Remédiation (TaRL)"];

export const STRIPE_LINKS = {
    student: "https://buy.stripe.com/test_...", 
    teacher: "https://buy.stripe.com/test_..." 
};

// CONFIGURATION PAR DÉFAUT : LYCÉE
export const defaultConfig: ExerciseOptions = {
    level: "2ème Année Bac - Sciences Physiques / SVT",
    subject: "Physique",
    chapter: "Ondes mécaniques progressives",
    selectedChapters: [], // Par défaut vide (mode simple)
    difficulty: "Intermédiaire",
    type: "Exercice à développer",
    objective: "Raisonnement scientifique",
    includeIllustration: true,
    useAI: true,
    professorName: "",
    schoolName: "",
    includeOfficialHeader: true,
    exerciseCount: 3
};

// --- SECURITY CONFIG ---
export const RATE_LIMITS: Record<string, RateLimits> = {
    'TEACHER_FREE': { maxRequestsPerMinute: 2, maxRequestsPerHour: 10 },
    'TEACHER_PRO': { maxRequestsPerMinute: 20, maxRequestsPerHour: 300 },
    'STUDENT_FREE': { maxRequestsPerMinute: 1, maxRequestsPerHour: 5 },
    'STUDENT_PASS_24H': { maxRequestsPerMinute: 10, maxRequestsPerHour: 100 },
    'STUDENT_PACK_BAC': { maxRequestsPerMinute: 10, maxRequestsPerHour: 100 }
};

// Feature Gating Functions
export const canExportWord = (plan: string): boolean => {
    return plan === 'TEACHER_PRO';
};

export const hasUnlimitedAI = (plan: string): boolean => {
    return ['TEACHER_PRO', 'STUDENT_PASS_24H', 'STUDENT_PACK_BAC'].includes(plan);
};

export const canGenerateExercises = (plan: string): boolean => {
    return !['STUDENT_FREE'].includes(plan);
};

export const canAccessDetailedCorrections = (plan: string): boolean => {
    return !['STUDENT_FREE', 'TEACHER_FREE'].includes(plan);
};

export const hasNoWatermark = (plan: string): boolean => {
    return plan === 'TEACHER_PRO';
};

export const hasPrioritySupport = (plan: string): boolean => {
    return plan === 'TEACHER_PRO';
};

export const DEFAULT_AI_MODEL = "gemini-2.5-flash";

// Feature Gating per Plan
export const PLAN_FEATURES = {
    'TEACHER_FREE': {
        canExportWord: false,
        maxDailyCredits: 3,
        accessRevision: true, // Teachers always have access
        hasNoWatermark: false,
        canGenerateExercises: true,
        canAccessDetailedCorrections: false
    },
    'TEACHER_PRO': {
        canExportWord: true,
        maxDailyCredits: 999, // Unlimited
        accessRevision: true,
        hasNoWatermark: true,
        canGenerateExercises: true,
        canAccessDetailedCorrections: true
    },
    'STUDENT_FREE': {
        canExportWord: false,
        maxDailyCredits: 0,
        accessRevision: false,
        hasNoWatermark: false,
        canGenerateExercises: false,
        canAccessDetailedCorrections: false
    },
    'STUDENT_PASS_24H': {
        canExportWord: false,
        maxDailyCredits: 50,
        accessRevision: true,
        hasNoWatermark: false,
        canGenerateExercises: true,
        canAccessDetailedCorrections: true
    },
    'STUDENT_PACK_BAC': {
        canExportWord: false,
        maxDailyCredits: 50,
        accessRevision: true,
        hasNoWatermark: false,
        canGenerateExercises: true,
        canAccessDetailedCorrections: true
    }
};

// --- UI FEATURE FLAGS ---
// Controls which UI components are rendered (Ministry theme vs Standard)
export const UI_THEME = (
  import.meta.env.VITE_UI_THEME || 
  process.env.UI_THEME || 
  'standard'
) as 'standard' | 'ministry';

// Feature flag to enable/disable Ministry integration features
export const ENABLE_MINISTRY_FEATURES = import.meta.env.VITE_ENABLE_MINISTRY === 'true' || false;

// Log which theme is active (for debugging)
if (typeof window !== 'undefined') {
  console.log(`[ProfiV] Active UI Theme: ${UI_THEME}`);
}
