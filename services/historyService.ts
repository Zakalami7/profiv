
import { supabase } from './supabaseClient';
import type { HistoryItem } from '../types';

export const getUserHistory = async (userId: string): Promise<HistoryItem[]> => {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('user_histories')
            .select('data')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            // Si la table n'existe pas encore (Code 42P01 ou message spécifique), on l'ignore silencieusement
            if (error.code !== '42P01' && !error.message.includes('Could not find the table')) {
                console.warn("Erreur chargement historique cloud:", error.message);
            }
            return [];
        }

        return data.map((row: any) => row.data as HistoryItem);
    } catch (e) {
        return [];
    }
};

export const addToHistory = async (userId: string, item: HistoryItem) => {
    if (!supabase) return;

    try {
        const { error } = await supabase.from('user_histories').insert({
            user_id: userId,
            data: item
        });
        if (error) {
            // Ignorer l'erreur si la table n'existe pas
            if (error.code !== '42P01' && !error.message.includes('Could not find the table')) {
                console.error("Erreur sauvegarde historique cloud:", error.message);
            }
        }
    } catch (e) {
        // Fail silently
    }
};

export const removeFromHistory = async (userId: string, itemId: string) => {
    if (!supabase) return;

    try {
        // Utilisation du filtre JSON pour cibler l'ID à l'intérieur de la colonne 'data'
        const { error } = await supabase
            .from('user_histories')
            .delete()
            .eq('user_id', userId)
            .filter('data->>id', 'eq', itemId); // Syntaxe PostgREST pour JSONB

        if (error) {
            if (error.code !== '42P01' && !error.message.includes('Could not find the table')) {
                console.error("Erreur suppression historique cloud:", error.message);
            }
        }
    } catch (e) {
        // Fail silently
    }
};
