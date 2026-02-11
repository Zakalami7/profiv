
import { from } from '../database/query-builder';
import { CURRICULUM } from '../constants';
import type { Curriculum } from '../types';

let cachedCurriculum: Curriculum | null = null;

export const getCurriculum = async (): Promise<Curriculum> => {
    // 1. Retourner le cache mémoire si dispo
    if (cachedCurriculum) return cachedCurriculum;

    try {
        // 2. Essayer de fetcher la config dynamique depuis SQLite
        const { data, error } = await from('system_config')
            .select('curriculum_json')
            .single();

        if (error || !data || !data.curriculum_json) {
            // Pas de config distante ou erreur, on utilise le local
            cachedCurriculum = CURRICULUM;
            return CURRICULUM;
        }

        // 3. Succès depuis la base locale
        console.log("Programme scolaire chargé depuis SQLite 📚");
        
        // Parse JSON if stored as string
        const curriculumData = typeof data.curriculum_json === 'string'
            ? JSON.parse(data.curriculum_json)
            : data.curriculum_json;
            
        cachedCurriculum = curriculumData as Curriculum;
        return cachedCurriculum;

    } catch (e) {
        console.warn("Erreur chargement programme depuis SQLite, repli sur local.", e);
        return CURRICULUM;
    }
};

// Force le rechargement (utile pour l'admin)
export const refreshCurriculum = () => {
    cachedCurriculum = null;
    return getCurriculum();
};
