
/**
 * Types partagés pour l'intégration Gemini 2.5 Flash
 * Ces types sont utilisés à la fois par le frontend et le backend
 */

import { z } from 'zod';

// Schéma Zod pour la validation des exercices générés
export const ExerciseSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  enonce: z.string().min(10, "L'énoncé doit contenir au moins 10 caractères"),

  corrige: z.string().min(10, "La correction doit contenir au moins 10 caractères"),

  illustrationSVG: z.string().optional()
});

export const ExercisesResponseSchema = z.array(ExerciseSchema);

// Types inférés depuis les schémas Zod
export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExercisesResponse = z.infer<typeof ExercisesResponseSchema>;

// Configuration pour la génération d'exercices
export interface GenerationConfig {
  level: string;
  subject: string;
  chapter: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  type: string;
  objective: string;
  exerciseCount: number;
  selectedChapters?: Array<{
    chapter: string;
    count: number;
  }>;
}

// Configuration du batch mode
export interface BatchConfig extends GenerationConfig {
  batchSize: number; // Nombre d'exercices par lot (max 5 recommandé)
  totalExercises: number; // Nombre total d'exercices à générer
}

// Réponse de l'API Gemini
export interface GeminiResponse {
  exercises: Exercise[];
  model: string;
  tokensUsed: number;
  cost: number;
}

// Configuration du cache
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Durée de vie en secondes
  maxSize: number; // Nombre maximum d'entrées
}

// Configuration du rate limiting
export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
}

// Statistiques d'utilisation
export interface UsageStats {
  totalRequests: number;
  totalExercisesGenerated: number;
  totalCost: number;
  averageCostPerExercise: number;
  cacheHitRate: number;
  lastReset: string;
}

// Configuration de l'application
export interface AppConfig {
  gemini: {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  cache: CacheConfig;
  rateLimit: RateLimitConfig;
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Types pour les prompts MEN
export interface MENPrompt {
  id: string;
  level: string;
  subject: string;
  chapter: string;
  difficulty: string;
  promptAr: string;
  promptFr: string;
  structure?: {
    components: Array<{
      name: string;
      weight: string;
      description: string;
    }>;
    guidelines: string[];
  };
}

// Fonction pour construire un prompt dynamique
export interface PromptBuilderOptions {
  level: string;
  subject: string;
  chapter: string;
  difficulty: string;
  language: 'ar' | 'fr';
  exerciseCount: number;
  includeInstructions?: boolean;
  customInstructions?: string;
}

export interface PromptBuilderResult {
  prompt: string;
  metadata: {
    level: string;
    subject: string;
    chapter: string;
    difficulty: string;
    language: string;
    exerciseCount: number;
  };
}
