
/**
 * Serveur Express avec intégration Gemini 2.5 Flash
 * Features: Validation Zod, Cache Redis/Mongo, Batch Mode, Rate Limiting, Monitoring
 */

const express = require('express');
const { GoogleGenAI, Type } = require('@google/genai');
const { z } = require('zod');
const Redis = require('redis');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Charger les variables d\'environnement
dotenv.config();

// Initialisation de l\'application
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 4096
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED !== 'false'
  },
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/profiV',
    enabled: process.env.MONGODB_ENABLED !== 'false'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par windowMs
    standardHeaders: true,
    legacyHeaders: false
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use('/api/', limiter);

// Initialisation des services
let redisClient = null;
let ai = null;

// Initialisation Redis
async function initializeRedis() {
  if (config.redis.enabled) {
    try {
      redisClient = Redis.createClient({ url: config.redis.url });
      await redisClient.connect();
      console.log('✅ Redis connecté');
    } catch (error) {
      console.warn('⚠️ Erreur de connexion Redis:', error.message);
      config.redis.enabled = false;
    }
  }
}

// Initialisation MongoDB
async function initializeMongo() {
  if (config.mongo.enabled) {
    try {
      await mongoose.connect(config.mongo.uri);
      console.log('✅ MongoDB connecté');
    } catch (error) {
      console.warn('⚠️ Erreur de connexion MongoDB:', error.message);
      config.mongo.enabled = false;
    }
  }
}

// Initialisation Gemini
function initializeGemini() {
  if (config.gemini.apiKey) {
    ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    console.log('✅ Gemini initialisé');
  } else {
    console.warn('⚠️ Clé API Gemini non configurée');
  }
}

// Schéma Mongoose pour les exercices
const exerciseSchema = new mongoose.Schema({
  signature: { type: String, required: true, unique: true },
  level: String,
  subject: String,
  chapter: String,
  difficulty: String,
  type: String,
  objective: String,
  exerciseCount: Number,
  exercises: [{
    id: String,
    title: String,
    enonce: String,
    corrige: String,
    illustrationSVG: String
  }],
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

// Schéma Zod pour validation des exercices
const ExerciseSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  enonce: z.string().min(10, 'L\'énoncé doit contenir au moins 10 caractères'),
  corrige: z.string().min(10, 'La correction doit contenir au moins 10 caractères'),
  illustrationSVG: z.string().optional()
});

const ExercisesResponseSchema = z.array(ExerciseSchema);

// Fonction de logging
function log(level, message, data = null) {
  if (!config.monitoring.enabled) return;

  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(config.monitoring.logLevel);
  const messageLevelIndex = levels.indexOf(level);

  if (messageLevelIndex >= currentLevelIndex) {
    const timestamp = new Date().toISOString();
    const logMessage = data ? `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}` : `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
  }
}

// Fonction pour générer une signature de cache
function generateCacheSignature(options) {
  const { level, subject, chapter, difficulty, type, objective, exerciseCount, selectedChapters } = options;
  let chapterKey = chapter;

  if (selectedChapters && selectedChapters.length > 0) {
    chapterKey = selectedChapters
      .sort((a, b) => a.chapter.localeCompare(b.chapter))
      .map(c => `${c.chapter}:${c.count}`)
      .join('|');
  }

  return `${level}-${subject}-${chapterKey}-${difficulty}-${type}-${objective}-${exerciseCount}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Fonction pour récupérer depuis le cache
async function getFromCache(signature) {
  // D\'abord essayer Redis
  if (config.redis.enabled && redisClient) {
    try {
      const cached = await redisClient.get(signature);
      if (cached) {
        const entry = JSON.parse(cached);
        if (Date.now() - entry.timestamp < entry.ttl * 1000) {
          log('info', 'Cache hit (Redis)', { signature });
          return entry.data;
        } else {
          // Entrée expirée
          await redisClient.del(signature);
        }
      }
    } catch (error) {
      log('error', 'Erreur Redis', { error: error.message });
    }
  }

  // Ensuite essayer MongoDB
  if (config.mongo.enabled) {
    try {
      const exercise = await Exercise.findOne({ signature });
      if (exercise && (!exercise.expiresAt || exercise.expiresAt > new Date())) {
        log('info', 'Cache hit (MongoDB)', { signature });
        return exercise.exercises;
      }
    } catch (error) {
      log('error', 'Erreur MongoDB', { error: error.message });
    }
  }

  log('info', 'Cache miss', { signature });
  return null;
}

// Fonction pour stocker dans le cache
async function storeInCache(signature, options, exercises, ttl = 86400) {
  // Stocker dans Redis
  if (config.redis.enabled && redisClient) {
    try {
      const entry = {
        data: exercises,
        timestamp: Date.now(),
        ttl: ttl
      };
      await redisClient.setEx(signature, ttl, JSON.stringify(entry));
      log('info', 'Stocké dans Redis', { signature, ttl });
    } catch (error) {
      log('error', 'Erreur stockage Redis', { error: error.message });
    }
  }

  // Stocker dans MongoDB
  if (config.mongo.enabled) {
    try {
      const expiresAt = new Date(Date.now() + ttl * 1000);
      await Exercise.findOneAndUpdate(
        { signature },
        {
          signature,
          level: options.level,
          subject: options.subject,
          chapter: options.chapter,
          difficulty: options.difficulty,
          type: options.type,
          objective: options.objective,
          exerciseCount: options.exerciseCount,
          exercises,
          expiresAt
        },
        { upsert: true, new: true }
      );
      log('info', 'Stocké dans MongoDB', { signature, expiresAt });
    } catch (error) {
      log('error', 'Erreur stockage MongoDB', { error: error.message });
    }
  }
}

// Fonction pour construire le prompt
function buildPrompt(options) {
  const { level, subject, chapter, difficulty, exerciseCount, type, objective } = options;

  // Détection de la langue Arabe
  const isArabicSubject = ["Arabe", "Education Islamique"].includes(subject);

  if (isArabicSubject) {
    // Prompt en Arabe
    return `
      تقمص دور مفتش تربوي بوزارة التربية الوطنية والتعليم الأولي والرياضة (المغرب).
      المهمة: صياغة موضوع امتحان (فرض محروس أو امتحان موحد) للمستوى: ${level}.
      المادة: ${subject}.
      المجال: ${chapter}.
      مستوى الصعوبة: ${difficulty}.
      عدد التمارين: ${exerciseCount}.

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
    `;
  } else {
    // Prompt en Français
    let scienceInstructions = "";
    if (["Physique", "Chimie", "Physique-Chimie", "Mathématiques"].includes(subject)) {
      scienceInstructions = `
      **STRUCTURE OBLIGATOIRE "EXAMEN NATIONAL" :**
      1. **En-tête de l\'exercice** :
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

    return `
      Rôle : Inspecteur Pédagogique (Ministère de l\'Éducation Nationale - Maroc).
      Tâche : Rédiger un sujet d\'examen officiel (Devoir Surveillé ou Examen Blanc) pour le niveau : ${level}.
      Matière : ${subject}.
      Chapitre : ${chapter}.
      Difficulté : ${difficulty}.
      Nombre d\'exercices : ${exerciseCount}.
      Type : ${type}.
      Objectif : ${objective}.

      **INSTRUCTIONS DE FORME (STRICTES) :**
      - Le contenu doit respecter scrupuleusement le **Cadre de Référence (Cadre Référentiel)** de l\'année en cours.
      - **Mise en page** : Utilise Markdown pour simuler la mise en page officielle (Gras pour les mots clés, Listes pour les données).
      - **Barème** : Indique une estimation des points pour chaque question (ex: (0.5 pt)).
      - **Rigueur** : Aucune ambiguïté dans les questions. Les notations doivent être celles utilisées dans les manuels marocains officiels.
      - **Important** : Ne mentionnez pas le nom du chapitre ou du thème dans le titre de l\'exercice ou dans son contenu.

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
}

// Endpoint: /health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      redis: config.redis.enabled ? 'connected' : 'disabled',
      mongo: config.mongo.enabled ? 'connected' : 'disabled',
      gemini: ai ? 'configured' : 'not configured'
    }
  });
});

// Endpoint: /generate
app.post('/api/generate', async (req, res) => {
  const startTime = Date.now();

  try {
    if (!ai) {
      return res.status(500).json({ error: 'Service IA non configuré' });
    }

    // Validation des options
    const options = req.body;
    const signature = generateCacheSignature(options);

    log('info', 'Demande de génération', { signature, options });

    // Vérifier le cache
    const cached = await getFromCache(signature);
    if (cached) {
      return res.json({
        exercises: cached,
        cached: true,
        duration: Date.now() - startTime
      });
    }

    // Générer le prompt
    const prompt = buildPrompt(options);

    // Appel à l\'API Gemini
    const response = await ai.models.generateContent({
      model: config.gemini.model,
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

    // Parser et valider la réponse
    const parsed = JSON.parse(response.text);
    const validated = ExercisesResponseSchema.parse(parsed);

    // Ajouter des IDs si manquants
    const exercises = validated.map((ex, i) => ({
      ...ex,
      id: ex.id || `gen-${Date.now()}-${i}`,
      title: ex.title || `Exercice ${i+1}`
    }));

    // Stocker dans le cache
    await storeInCache(signature, options, exercises);

    log('info', 'Exercices générés avec succès', { 
      signature, 
      count: exercises.length,
      duration: Date.now() - startTime 
    });

    res.json({
      exercises,
      cached: false,
      duration: Date.now() - startTime
    });
  } catch (error) {
    log('error', 'Erreur de génération', { error: error.message });

    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Erreur de validation des exercices',
        details: error.errors 
      });
    }

    res.status(500).json({ error: error.message });
  }
});

// Endpoint: /batch-generate
app.post('/api/batch-generate', async (req, res) => {
  const startTime = Date.now();

  try {
    if (!ai) {
      return res.status(500).json({ error: 'Service IA non configuré' });
    }

    const { options, batchSize = 5 } = req.body;
    const totalExercises = options.exerciseCount || 10;
    const batches = Math.ceil(totalExercises / batchSize);

    log('info', 'Demande de génération en lot', { 
      totalExercises, 
      batchSize, 
      batches 
    });

    const allExercises = [];
    let totalCost = 0;
    let cachedCount = 0;

    for (let i = 0; i < batches; i++) {
      const batchOptions = {
        ...options,
        exerciseCount: Math.min(batchSize, totalExercises - allExercises.length)
      };

      const signature = generateCacheSignature(batchOptions);

      // Vérifier le cache pour ce lot
      const cached = await getFromCache(signature);
      if (cached) {
        allExercises.push(...cached);
        cachedCount++;
        log('info', 'Lot trouvé dans le cache', { batch: i + 1, count: cached.length });
        continue;
      }

      // Générer le prompt pour ce lot
      const prompt = buildPrompt(batchOptions);

      // Appel à l\'API Gemini
      const response = await ai.models.generateContent({
        model: config.gemini.model,
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

      // Parser et valider la réponse
      const parsed = JSON.parse(response.text);
      const validated = ExercisesResponseSchema.parse(parsed);

      // Ajouter des IDs si manquants
      const exercises = validated.map((ex, idx) => ({
        ...ex,
        id: ex.id || `gen-${Date.now()}-${i}-${idx}`,
        title: ex.title || `Exercice ${allExercises.length + idx + 1}`
      }));

      // Stocker dans le cache
      await storeInCache(signature, batchOptions, exercises);

      allExercises.push(...exercises);
      log('info', 'Lot généré avec succès', { batch: i + 1, count: exercises.length });
    }

    const duration = Date.now() - startTime;
    const costPerExercise = totalCost / totalExercises;

    log('info', 'Génération en lot terminée', { 
      totalExercises: allExercises.length,
      batches,
      cachedCount,
      duration,
      costPerExercise
    });

    res.json({
      exercises: allExercises,
      batches,
      totalCost,
      costPerExercise,
      cachedCount,
      duration
    });
  } catch (error) {
    log('error', 'Erreur de génération en lot', { error: error.message });

    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Erreur de validation des exercices',
        details: error.errors 
      });
    }

    res.status(500).json({ error: error.message });
  }
});

// Endpoint: /exercices-cache/:niveau
app.get('/api/exercices-cache/:niveau', async (req, res) => {
  try {
    const { niveau } = req.params;

    if (!config.mongo.enabled) {
      return res.status(503).json({ error: 'MongoDB non disponible' });
    }

    const exercises = await Exercise.find({
      level: new RegExp(niveau.replace('-', ' '), 'i'),
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    res.json({
      exercises,
      total: exercises.length
    });
  } catch (error) {
    log('error', 'Erreur récupération cache', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: DELETE /exercices-cache/:signature
app.delete('/api/exercices-cache/:signature', async (req, res) => {
  try {
    const { signature } = req.params;

    // Supprimer de Redis
    if (config.redis.enabled && redisClient) {
      await redisClient.del(signature);
    }

    // Supprimer de MongoDB
    if (config.mongo.enabled) {
      await Exercise.deleteOne({ signature });
    }

    log('info', 'Exercice supprimé du cache', { signature });

    res.json({
      success: true,
      message: 'Exercice supprimé du cache'
    });
  } catch (error) {
    log('error', 'Erreur suppression cache', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: /stats
app.get('/api/stats', async (req, res) => {
  try {
    if (!config.mongo.enabled) {
      return res.status(503).json({ error: 'MongoDB non disponible' });
    }

    const stats = {
      totalRequests: 0,
      totalExercisesGenerated: 0,
      totalCost: 0,
      averageCostPerExercise: 0,
      cacheHitRate: 0,
      lastReset: new Date().toISOString()
    };

    // Calculer les statistiques depuis MongoDB
    const allExercises = await Exercise.find({});
    stats.totalExercisesGenerated = allExercises.reduce((acc, ex) => acc + ex.exerciseCount, 0);

    res.json(stats);
  } catch (error) {
    log('error', 'Erreur récupération stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint non trouvé' });
});

// Gestionnaire d\'erreurs global
app.use((err, req, res, next) => {
  log('error', 'Erreur serveur', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Initialisation et démarrage
async function start() {
  await initializeRedis();
  await initializeMongo();
  initializeGemini();

  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📊 Monitoring: ${config.monitoring.enabled ? 'activé' : 'désactivé'}`);
    console.log(`🔒 Rate Limiting: ${config.rateLimit.max} requêtes/${config.rateLimit.windowMs/60000} minutes`);
  });
}

start();
