/**
 * Serveur Express avec intégration Gemini 2.5 Flash
 * Features: Validation Zod, Cache Redis/Mongo, Batch Mode, Rate Limiting, Monitoring
 */

import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
// Redis and MongoDB disabled - using SQLite only
// import Redis from 'redis';
// import mongoose from 'mongoose';

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

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

// Initialisation de l'application

const app = express();
const PORT = process.env.PORT || 3001;


// Configuration
const config = {

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 4096
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: false // Disabled - using SQLite only
  },
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/profiV',
    enabled: false // Disabled - using SQLite only
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
// let redisClient = null; // Disabled - using SQLite only
let ai = null;

// Initialisation Redis - DISABLED (using SQLite only)
async function initializeRedis() {
  // Redis disabled - using SQLite for caching
  console.log('💾 Cache: SQLite (Redis disabled)');
}

// Initialisation MongoDB - DISABLED (using SQLite only)
async function initializeMongo() {
  // MongoDB disabled - using SQLite as primary database
  console.log('🗄️  Base de données: SQLite (MongoDB disabled)');
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

// MongoDB Schema - DISABLED (using SQLite only)
// const exerciseSchema = new mongoose.Schema({...});
// const Exercise = mongoose.model('Exercise', exerciseSchema);

// SQLite cache placeholder - exercises are cached in SQLite
const Exercise = {
  findOne: async () => null,
  find: async () => [],
  countDocuments: async () => 0,
  findOneAndUpdate: async () => null,
  deleteOne: async () => null
};


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
  // Redis and MongoDB disabled - using in-memory cache only
  // TODO: Implement SQLite cache table for persistent caching
  
  log('info', 'Cache miss (Redis/MongoDB disabled, using SQLite)', { signature });
  return null;
}


// Fonction pour stocker dans le cache
async function storeInCache(signature, options, exercises, ttl = 86400) {
  // Redis and MongoDB disabled - cache storage skipped
  // TODO: Implement SQLite cache table for persistent caching
  log('info', 'Cache storage skipped (Redis/MongoDB disabled)', { signature });
}


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

    // Appel à l'API Gemini
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

    // Ajouter des IDs si manquants et nettoyer le LaTeX
    const exercises = validated.map((ex, i) => ({
      ...ex,
      id: ex.id || `gen-${Date.now()}-${i}`,
      title: ex.title || `Exercice ${i+1}`,
      enonce: cleanLatexForKaTeX(ex.enonce),
      corrige: cleanLatexForKaTeX(ex.corrige)
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
        log('info', 'Lot trouvé dans le cache', { batch: i + 1, count: cached.length });
        continue;
      }

      // Générer le prompt pour ce lot
      const prompt = buildPrompt(batchOptions);

      // Appel à l'API Gemini
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

      // Ajouter des IDs si manquants et nettoyer le LaTeX
      const exercises = validated.map((ex, idx) => ({
        ...ex,
        id: ex.id || `gen-${Date.now()}-${i}-${idx}`,
        title: ex.title || `Exercice ${allExercises.length + idx + 1}`,
        enonce: cleanLatexForKaTeX(ex.enonce),
        corrige: cleanLatexForKaTeX(ex.corrige)
      }));

      // Stocker dans le cache
      await storeInCache(signature, batchOptions, exercises);


      allExercises.push(...exercises);
      log('info', 'Lot généré avec succès', { batch: i + 1, count: exercises.length });
    }

    log('info', 'Génération en lot terminée', { 
      totalExercises: allExercises.length,
      duration: Date.now() - startTime 
    });

    res.json({
      exercises: allExercises,
      cached: false,
      duration: Date.now() - startTime,
      cost: totalCost
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

    // MongoDB disabled - return empty array with message
    log('info', 'Cache endpoint called (MongoDB disabled)', { niveau });
    
    res.json({ 
      exercises: [],
      message: 'Cache persistant désactivé (MongoDB/Redis désactivés, utilisation de SQLite uniquement)'
    });
  } catch (error) {
    log('error', 'Erreur récupération cache', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});


// Endpoint: /stats
app.get('/api/stats', async (req, res) => {
  try {
    let stats = {
      totalExercises: 0,
      cacheSize: 0,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'SQLite (MongoDB/Redis disabled)'
    };

    // MongoDB and Redis disabled - using SQLite only
    // TODO: Add SQLite stats when cache table is implemented

    res.json(stats);
  } catch (error) {
    log('error', 'Erreur récupération stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Database REST API endpoints for browser adapter
// Import database modules dynamically
let dbModule = null;

async function getDb() {
  if (!dbModule) {
    // Dynamic import of database modules (only in Node.js)
    const { getDatabase } = await import('../database/connection.ts');

    dbModule = await getDatabase();
  }
  return dbModule;
}

// GET /api/:table - Query with filters
app.get('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { columns, order, limit, ...filters } = req.query;
    
    const db = await getDb();
    
    // Build SELECT clause
    const selectColumns = columns || '*';
    
    // Build WHERE clause from filters
    const whereConditions = [];
    const params = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (key.endsWith('_neq')) {
        whereConditions.push(`${key.replace('_neq', '')} != ?`);
        params.push(value);
      } else if (key.endsWith('_gt')) {
        whereConditions.push(`${key.replace('_gt', '')} > ?`);
        params.push(value);
      } else if (key.endsWith('_gte')) {
        whereConditions.push(`${key.replace('_gte', '')} >= ?`);
        params.push(value);
      } else if (key.endsWith('_lt')) {
        whereConditions.push(`${key.replace('_lt', '')} < ?`);
        params.push(value);
      } else if (key.endsWith('_lte')) {
        whereConditions.push(`${key.replace('_lte', '')} <= ?`);
        params.push(value);
      } else if (key.endsWith('_like')) {
        whereConditions.push(`${key.replace('_like', '')} LIKE ?`);
        params.push(`%${value}%`);
      } else if (key.endsWith('_ilike')) {
        whereConditions.push(`LOWER(${key.replace('_ilike', '')}) LIKE LOWER(?)`);
        params.push(`%${value}%`);
      } else if (key.endsWith('_in')) {
        const values = String(value).split(',');
        whereConditions.push(`${key.replace('_in', '')} IN (${values.map(() => '?').join(', ')})`);
        params.push(...values);
      } else if (key.endsWith('_is')) {
        if (value === 'null') {
          whereConditions.push(`${key.replace('_is', '')} IS NULL`);
        } else {
          whereConditions.push(`${key.replace('_is', '')} IS ?`);
          params.push(value);
        }
      } else {
        whereConditions.push(`${key} = ?`);
        params.push(value);
      }
    });
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Build ORDER BY clause
    let orderClause = '';
    if (order) {
      const [column, direction] = String(order).split(':');
      orderClause = `ORDER BY ${column} ${direction === 'desc' ? 'DESC' : 'ASC'}`;
    }
    
    // Build LIMIT clause
    const limitClause = limit ? `LIMIT ${limit}` : '';
    
    const query = `SELECT ${selectColumns} FROM ${table} ${whereClause} ${orderClause} ${limitClause}`.trim();
    
    const data = await db.all(query, params);
    res.json(data);
  } catch (error) {
    log('error', 'Erreur requête GET', { error: error.message, table: req.params.table });
    res.status(500).json({ error: error.message });
  }
});

// POST /api/:table - Insert new record
app.post('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const data = req.body;
    
    const db = await getDb();
    
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : v
    );
    
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    const result = await db.run(query, values);
    
    // Return inserted data with ID
    const insertedData = { ...data, id: result.lastID };
    res.json(insertedData);
  } catch (error) {
    log('error', 'Erreur insertion', { error: error.message, table: req.params.table });
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/:table - Update records with filters
app.put('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const data = req.body;
    const { ...filters } = req.query;
    
    const db = await getDb();
    
    // Build SET clause
    const setColumns = Object.keys(data);
    const setClause = setColumns.map(col => `${col} = ?`).join(', ');
    const setValues = Object.values(data).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : v
    );
    
    // Build WHERE clause from filters
    const whereConditions = [];
    const whereParams = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (key.endsWith('_neq')) {
        whereConditions.push(`${key.replace('_neq', '')} != ?`);
        whereParams.push(value);
      } else if (key.endsWith('_gt')) {
        whereConditions.push(`${key.replace('_gt', '')} > ?`);
        whereParams.push(value);
      } else if (key.endsWith('_gte')) {
        whereConditions.push(`${key.replace('_gte', '')} >= ?`);
        whereParams.push(value);
      } else if (key.endsWith('_lt')) {
        whereConditions.push(`${key.replace('_lt', '')} < ?`);
        whereParams.push(value);
      } else if (key.endsWith('_lte')) {
        whereConditions.push(`${key.replace('_lte', '')} <= ?`);
        whereParams.push(value);
      } else if (key.endsWith('_like')) {
        whereConditions.push(`${key.replace('_like', '')} LIKE ?`);
        whereParams.push(`%${value}%`);
      } else if (key.endsWith('_ilike')) {
        whereConditions.push(`LOWER(${key.replace('_ilike', '')}) LIKE LOWER(?)`);
        whereParams.push(`%${value}%`);
      } else if (key.endsWith('_in')) {
        const values = String(value).split(',');
        whereConditions.push(`${key.replace('_in', '')} IN (${values.map(() => '?').join(', ')})`);
        whereParams.push(...values);
      } else if (key.endsWith('_is')) {
        if (value === 'null') {
          whereConditions.push(`${key.replace('_is', '')} IS NULL`);
        } else {
          whereConditions.push(`${key.replace('_is', '')} IS ?`);
          whereParams.push(value);
        }
      } else {
        whereConditions.push(`${key} = ?`);
        whereParams.push(value);
      }
    });
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // First, get the IDs of rows to update
    const idQuery = `SELECT id FROM ${table} ${whereClause}`;
    const rowsToUpdate = await db.all(idQuery, whereParams);
    
    if (rowsToUpdate.length === 0) {
      return res.json([]);
    }
    
    // Perform update
    const allParams = [...setValues, ...whereParams];
    const updateQuery = `UPDATE ${table} SET ${setClause} ${whereClause}`;
    await db.run(updateQuery, allParams);
    
    // Fetch updated rows
    const ids = rowsToUpdate.map(r => r.id);
    const fetchQuery = `SELECT * FROM ${table} WHERE id IN (${ids.map(() => '?').join(', ')})`;
    const updatedData = await db.all(fetchQuery, ids);
    
    res.json(updatedData);
  } catch (error) {
    log('error', 'Erreur mise à jour', { error: error.message, table: req.params.table });
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/:table - Delete records with filters
app.delete('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { ...filters } = req.query;
    
    const db = await getDb();
    
    // Build WHERE clause from filters
    const whereConditions = [];
    const params = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (key.endsWith('_neq')) {
        whereConditions.push(`${key.replace('_neq', '')} != ?`);
        params.push(value);
      } else if (key.endsWith('_gt')) {
        whereConditions.push(`${key.replace('_gt', '')} > ?`);
        params.push(value);
      } else if (key.endsWith('_gte')) {
        whereConditions.push(`${key.replace('_gte', '')} >= ?`);
        params.push(value);
      } else if (key.endsWith('_lt')) {
        whereConditions.push(`${key.replace('_lt', '')} < ?`);
        params.push(value);
      } else if (key.endsWith('_lte')) {
        whereConditions.push(`${key.replace('_lte', '')} <= ?`);
        params.push(value);
      } else if (key.endsWith('_like')) {
        whereConditions.push(`${key.replace('_like', '')} LIKE ?`);
        params.push(`%${value}%`);
      } else if (key.endsWith('_ilike')) {
        whereConditions.push(`LOWER(${key.replace('_ilike', '')}) LIKE LOWER(?)`);
        params.push(`%${value}%`);
      } else if (key.endsWith('_in')) {
        const values = String(value).split(',');
        whereConditions.push(`${key.replace('_in', '')} IN (${values.map(() => '?').join(', ')})`);
        params.push(...values);
      } else if (key.endsWith('_is')) {
        if (value === 'null') {
          whereConditions.push(`${key.replace('_is', '')} IS NULL`);
        } else {
          whereConditions.push(`${key.replace('_is', '')} IS ?`);
          params.push(value);
        }
      } else {
        whereConditions.push(`${key} = ?`);
        params.push(value);
      }
    });
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get count before delete
    const countQuery = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
    const countResult = await db.get(countQuery, params);
    
    // Perform delete
    const deleteQuery = `DELETE FROM ${table} ${whereClause}`;
    await db.run(deleteQuery, params);
    
    res.json({ count: countResult?.count || 0 });
  } catch (error) {
    log('error', 'Erreur suppression', { error: error.message, table: req.params.table });
    res.status(500).json({ error: error.message });
  }
});

// POST /api/:table/upsert - Upsert operation
app.post('/api/:table/upsert', async (req, res) => {
  try {
    const { table } = req.params;
    const { data, conflictColumn } = req.body;
    
    const db = await getDb();
    
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : v
    );
    
    // Build ON CONFLICT update clause
    const updateColumns = columns.filter(col => col !== conflictColumn);
    const updateClause = updateColumns.map(col => `${col} = excluded.${col}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT(${conflictColumn}) DO UPDATE SET
      ${updateClause}
    `;
    
    await db.run(query, values);
    
    // Fetch the upserted row
    const fetchQuery = `SELECT * FROM ${table} WHERE ${conflictColumn} = ?`;
    const result = await db.get(fetchQuery, data[conflictColumn]);
    
    res.json(result || null);
  } catch (error) {
    log('error', 'Erreur upsert', { error: error.message, table: req.params.table });
    res.status(500).json({ error: error.message });
  }
});



// Fonction pour nettoyer le LaTeX pour KaTeX
function cleanLatexForKaTeX(content) {
  if (!content) return "";
  
  return content
    // S'assurer que tous les indices ont des accolades
    .replace(/_([a-zA-Z0-9])(?![{a-zA-Z0-9])/g, '_{$1}')
    .replace(/_([0-9]+)(?![{0-9}])/g, '_{$1}')
    
    // S'assurer que tous les exposants ont des accolades
    .replace(/\^([a-zA-Z0-9])(?![{a-zA-Z0-9])/g, '^{$1}')
    .replace(/\^([0-9]+)(?![{0-9}])/g, '^{$1}')
    .replace(/\^([+-]?[0-9]+)/g, '^{$1}')
    
    // Corriger les puissances de 10
    .replace(/10\^([0-9]+)(?![{0-9}])/g, '10^{$1}')
    .replace(/10\^{([+-]?[0-9]+)}/g, '10^{$1}')
    
    // Corriger les virgules décimales dans les math
    .replace(/([0-9]+)\.([0-9]+)(?=[^}]*\$)/g, '$1{,}$2')
    
    // Corriger les fractions mal formées
    .replace(/\\frac([^{])/g, '\\frac{$1')
    
    // Corriger les espaces dans les unités
    .replace(/([0-9]+)\\text{/g, '$1\\,\\text{')
    
    // Corriger les symboles grecs mal écrits
    .replace(/\\mu(?![a-zA-Z])/g, '\\mu')
    .replace(/\\Omega(?![a-zA-Z])/g, '\\Omega')
    .replace(/\\alpha(?![a-zA-Z])/g, '\\alpha')
    .replace(/\\beta(?![a-zA-Z])/g, '\\beta')
    .replace(/\\gamma(?![a-zA-Z])/g, '\\gamma')
    .replace(/\\delta(?![a-zA-Z])/g, '\\delta')
    .replace(/\\theta(?![a-zA-Z])/g, '\\theta')
    .replace(/\\lambda(?![a-zA-Z])/g, '\\lambda')
    
    // Corriger les vecteurs
    .replace(/\\vec([^{])/g, '\\vec{$1}')
    .replace(/\\overrightarrow{([^}]+)}/g, '\\vec{$1}')
    
    // Corriger les dérivées
    .replace(/\\frac{d([a-z])}{dt}/g, '\\frac{d$1}{dt}')
    .replace(/\\frac{([a-z])}{d([a-z])}/g, '\\frac{d$1}{d$2}')
    
    // Corriger les multiplications implicites
    .replace(/([0-9])([a-zA-Z\\])/g, '$1\\times $2')
    
    // Supprimer les doubles dollars vides ou mal formés
    .replace(/\$\$\s*\$\$/g, '')
    .replace(/\$\s*\$/g, '');
}

// Fonction pour construire le prompt
function buildPrompt(options) {

  const { level, subject, chapter, difficulty, type, objective, exerciseCount, selectedChapters } = options;

  // Détection de la langue Arabe
  const isArabicSubject = ["Arabe", "Education Islamique"].includes(subject);

  if (isArabicSubject) {
    // Prompt en Arabe
    let chapterInstruction = `المجال الرئيسي: ${chapter}`;
    if (selectedChapters && selectedChapters.length > 0) {
      chapterInstruction = `توليف بين المجالات التالية: ${selectedChapters.map(c => c.chapter).join(' + ')}.`;
    }

    const arabicDiff = ARABIC_MAP[difficulty] || difficulty;

    return `
      تقمص دور مفتش تربوي بوزارة التربية الوطنية والتعليم الأولي والرياضة (المغرب).
      المهمة: صياغة موضوع امتحان (فرض محروس أو امتحان موحد) للمستوى: ${level}.
      المادة: ${subject}.
      ${chapterInstruction}
      مستوى الصعوبة: ${arabicDiff}.
      عدد التمارين: ${exerciseCount}.

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
    // Prompt en Français
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

      **RÈGLES KATEX STRICTES (TRÈS IMPORTANT) :**
      - TOUJOURS utiliser des accolades pour les indices et exposants : $x_{1}$ et $x^{2}$ (JAMAIS $x_1$ ou $x^2$)
      - TOUJOURS encadrer les fractions avec des dollars : $\\frac{a}{b}$ ou $$\\frac{a}{b}$$ pour les fractions en display mode
      - Utiliser \\times pour la multiplication (pas de point ou x)
      - Utiliser \\mu pour le micro (µ), \\Omega pour l'ohm (Ω)
      - Pour les unités : utiliser \\text{unité} avec espace fine \\, : $5\\,\\text{m/s}$
      - Pour les puissances de 10 : $10^{n}$ avec accolades obligatoires
      - Écrire les nombres avec virgule décimale : $3{,}14$ (pas $3.14$ dans le texte)
      - Utiliser \\approx pour "environ", \\neq pour "différent de"
      - Pour les vecteurs : \\vec{F} (pas \\overrightarrow{F})
      - Pour les dérivées : \\frac{di}{dt} (avec accolades sur les indices)
      `;
    }


    return `
      Rôle : Inspecteur Pédagogique (Ministère de l'Éducation Nationale - Maroc).
      Tâche : Rédiger un sujet d'examen officiel (Devoir Surveillé ou Examen Blanc) pour le niveau : ${level}.
      Matière : ${subject}.
      ${chapterInstruction}
      Difficulté : ${difficulty}.
      Nombre d'exercices : ${exerciseCount}.

      **INSTRUCTIONS DE FORME (STRICTES) :**
      - Le contenu doit respecter scrupuleusement le **Cadre de Référence (Cadre Référentiel)** de l'année en cours.
      - **Mise en page** : Utilise Markdown pour simuler la mise en page officielle (Gras pour les mots clés, Listes pour les données).
      - **Barème** : Indique une estimation des points pour chaque question (ex: (0.5 pt)).
      - **Rigueur** : Aucune ambiguïté dans les questions. Les notations doivent être celles utilisées dans les manuels marocains officiels.
      - **Important** : Ne mentionnez pas le nom du chapitre ou du thème dans le titre de l'exercice ou dans son contenu.

      ${scienceInstructions}

      **INSTRUCTIONS DE FORME (STRICTES) :**
      - Le contenu doit respecter scrupuleusement le **Cadre de Référence (Cadre Référentiel)** de l'année en cours.
      - **Mise en page** : Utilise Markdown pour simuler la mise en page officielle (Gras pour les mots clés, Listes pour les données).
      - **Barème** : Indique une estimation des points pour chaque question (ex: (0.5 pt)).
      - **Rigueur** : Aucune ambiguïté dans les questions. Les notations doivent être celles utilisées dans les manuels marocains officiels.
      - **Important** : Ne mentionnez pas le nom du chapitre ou du thème dans le titre de l'exercice ou dans son contenu.

      Format JSON attendu :
      [{
         "title": "Exercice [N]",
         "enonce": "Markdown riche (LaTeX, listes, gras)...",
         "corrige": "Correction détaillée pas à pas avec barème...",
         "illustrationSVG": "<svg>...</svg> (Uniquement si nécessaire)"
      }]
    `;
  }
}

// Initialisation des services au démarrage
async function initializeServices() {
  try {
    // Initialize Gemini
    initializeGemini();
    
    // Initialize Redis (disabled)
    await initializeRedis();
    
    // Initialize MongoDB (disabled)
    await initializeMongo();
    
    console.log('✅ Tous les services initialisés');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des services:', error);
    // Continue anyway - core functionality (Gemini) might still work
  }
}

// Démarrage du serveur
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
});

// Démarrer le serveur
startServer();

export default app;
