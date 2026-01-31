
import { supabase } from './supabaseClient';
import { CURRICULUM } from '../constants';
import type { Curriculum } from '../types';

let cachedCurriculum: Curriculum | null = null;

export const getCurriculum = async (): Promise<Curriculum> => {
    // 1. Retourner le cache mémoire si dispo
    if (cachedCurriculum) return cachedCurriculum;

    // 2. Si pas de Supabase, fallback local immédiat
    if (!supabase) return CURRICULUM;

    try {
        // 3. Essayer de fetcher la config dynamique depuis Supabase
        // On suppose une table 'system_config' avec une colonne 'curriculum_json'
        const { data, error } = await supabase
            .from('system_config')
            .select('curriculum_json')
            .single();

        if (error || !data || !data.curriculum_json) {
            // Pas de config distante ou erreur, on utilise le local
            cachedCurriculum = CURRICULUM;
            return CURRICULUM;
        }

        // 4. Succès distant
        console.log("Programme scolaire chargé depuis le Cloud ☁️");
        cachedCurriculum = data.curriculum_json as Curriculum;
        return cachedCurriculum;

    } catch (e) {
        console.warn("Erreur chargement programme distant, repli sur local.", e);
        return CURRICULUM;
    }
};

// Force le rechargement (utile pour l'admin)
export const refreshCurriculum = () => {
    cachedCurriculum = null;
    return getCurriculum();
};
