
import { CURRICULUM } from '../constants';
import type { Curriculum } from '../types';

let cachedCurriculum: Curriculum | null = null;

// API base URL for backend requests
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

export const getCurriculum = async (): Promise<Curriculum> => {
    // 1. Retourner le cache mémoire si dispo
    if (cachedCurriculum) return cachedCurriculum;

    try {
        // 2. Essayer de fetcher la config dynamique depuis le backend API
        const response = await fetch(`${API_BASE_URL}/system_config?columns=curriculum_json&limit=1`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data[0] || !data[0].curriculum_json) {
            // Pas de config distante, on utilise le local
            cachedCurriculum = CURRICULUM;
            return CURRICULUM;
        }

        // 3. Succès depuis le backend
        console.log("Programme scolaire chargé depuis le backend 📚");
        
        // Parse JSON if stored as string
        const curriculumData = typeof data[0].curriculum_json === 'string'
            ? JSON.parse(data[0].curriculum_json)
            : data[0].curriculum_json;
            
        cachedCurriculum = curriculumData as Curriculum;
        return cachedCurriculum;

    } catch (e) {
        console.warn("Erreur chargement programme depuis backend, repli sur local.", e);
        cachedCurriculum = CURRICULUM;
        return CURRICULUM;
    }
};

// Force le rechargement (utile pour l'admin)
export const refreshCurriculum = () => {
    cachedCurriculum = null;
    return getCurriculum();
};
