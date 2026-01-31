
/**
 * Utilitaires de cache pour les exercices générés
 * Supporte Redis (production) et localStorage (développement)
 */

import { Exercise, ExerciseOptions } from '../types';

interface CacheEntry {
  data: Exercise[];
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

class CacheManager {
  private redis: any = null;
  private mongo: any = null;
  private useLocalStorage: boolean = false;
  private stats: CacheStats = { hits: 0, misses: 0, hitRate: 0 };
  private readonly DEFAULT_TTL = 86400; // 24 heures en secondes
  private readonly MAX_ENTRIES = 1000;

  constructor() {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      // Tentative de connexion Redis (production)
      if (typeof window === 'undefined' && process.env.REDIS_URL) {
        const { createClient } = await import('redis');
        this.redis = createClient({ url: process.env.REDIS_URL });
        await this.redis.connect();
        console.log('Cache Redis initialisé');
      } else if (typeof window !== 'undefined') {
        // Fallback localStorage pour le frontend
        this.useLocalStorage = true;
        this.loadStats();
        console.log('Cache localStorage initialisé');
      }
    } catch (error) {
      console.warn('Erreur d\'initialisation du cache:', error);
      this.useLocalStorage = true;
    }
  }

  /**
   * Génère une signature unique pour les options d'exercices
   */
  private generateSignature(options: ExerciseOptions): string {
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

  /**
   * Récupère les exercices depuis le cache
   */
  async get(options: ExerciseOptions): Promise<Exercise[] | null> {
    try {
      const signature = this.generateSignature(options);

      if (this.redis) {
        // Redis cache
        const cached = await this.redis.get(signature);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          if (Date.now() - entry.timestamp < entry.ttl * 1000) {
            this.stats.hits++;
            this.updateHitRate();
            return entry.data;
          } else {
            // Entrée expirée
            await this.redis.del(signature);
          }
        }
      } else if (this.useLocalStorage) {
        // LocalStorage cache
        const cached = localStorage.getItem(`cache_${signature}`);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          if (Date.now() - entry.timestamp < entry.ttl * 1000) {
            this.stats.hits++;
            this.updateHitRate();
            this.saveStats();
            return entry.data;
          } else {
            // Entrée expirée
            localStorage.removeItem(`cache_${signature}`);
          }
        }
      }

      this.stats.misses++;
      this.updateHitRate();
      if (this.useLocalStorage) this.saveStats();
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du cache:', error);
      this.stats.misses++;
      this.updateHitRate();
      if (this.useLocalStorage) this.saveStats();
      return null;
    }
  }

  /**
   * Stocke les exercices dans le cache
   */
  async set(options: ExerciseOptions, data: Exercise[], ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const signature = this.generateSignature(options);
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl
      };

      if (this.redis) {
        // Redis cache
        await this.redis.setEx(signature, ttl, JSON.stringify(entry));

        // Gestion de la taille maximale du cache
        const keys = await this.redis.keys('*');
        if (keys.length > this.MAX_ENTRIES) {
          // Supprimer les entrées les plus anciennes
          const sortedKeys = await Promise.all(
            keys.map(async (key) => {
              const entry = await this.redis.get(key);
              const parsed: CacheEntry = JSON.parse(entry || '{}');
              return { key, timestamp: parsed.timestamp };
            })
          );
          sortedKeys.sort((a, b) => a.timestamp - b.timestamp);
          const toDelete = sortedKeys.slice(0, keys.length - this.MAX_ENTRIES);
          await Promise.all(toDelete.map(({ key }) => this.redis.del(key)));
        }
      } else if (this.useLocalStorage) {
        // LocalStorage cache
        localStorage.setItem(`cache_${signature}`, JSON.stringify(entry));

        // Gestion de la taille maximale du cache
        const cacheKeys = Object.keys(localStorage)
          .filter(key => key.startsWith('cache_'));
        if (cacheKeys.length > this.MAX_ENTRIES) {
          const entries = cacheKeys.map(key => {
            const entry = localStorage.getItem(key);
            const parsed: CacheEntry = JSON.parse(entry || '{}');
            return { key, timestamp: parsed.timestamp };
          });
          entries.sort((a, b) => a.timestamp - b.timestamp);
          const toDelete = entries.slice(0, cacheKeys.length - this.MAX_ENTRIES);
          toDelete.forEach(({ key }) => localStorage.removeItem(key));
        }
      }
    } catch (error) {
      console.error('Erreur lors du stockage dans le cache:', error);
    }
  }

  /**
   * Invalide une entrée du cache
   */
  async invalidate(options: ExerciseOptions): Promise<void> {
    try {
      const signature = this.generateSignature(options);

      if (this.redis) {
        await this.redis.del(signature);
      } else if (this.useLocalStorage) {
        localStorage.removeItem(`cache_${signature}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'invalidation du cache:', error);
    }
  }

  /**
   * Vide tout le cache
   */
  async clear(): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys('*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else if (this.useLocalStorage) {
        const cacheKeys = Object.keys(localStorage)
          .filter(key => key.startsWith('cache_'));
        cacheKeys.forEach(key => localStorage.removeItem(key));
      }

      // Reset stats
      this.stats = { hits: 0, misses: 0, hitRate: 0 };
      if (this.useLocalStorage) this.saveStats();
    } catch (error) {
      console.error('Erreur lors du vidage du cache:', error);
    }
  }

  /**
   * Met à jour le taux de succès du cache
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Sauvegarde les statistiques dans localStorage
   */
  private saveStats(): void {
    localStorage.setItem('cache_stats', JSON.stringify(this.stats));
  }

  /**
   * Charge les statistiques depuis localStorage
   */
  private loadStats(): void {
    try {
      const saved = localStorage.getItem('cache_stats');
      if (saved) {
        this.stats = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des statistiques du cache:', error);
    }
  }

  /**
   * Récupère les statistiques du cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Vérifie si le cache est disponible
   */
  isAvailable(): boolean {
    return this.redis !== null || this.useLocalStorage;
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
