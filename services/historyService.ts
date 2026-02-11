
import { from } from '../database/query-builder';
import type { HistoryItem } from '../types';

export const getUserHistory = async (userId: string): Promise<HistoryItem[]> => {
    try {
        const { data, error } = await from('user_histories')
            .select('data')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50)
            .execute();

        if (error) {
            console.warn("Erreur chargement historique:", error.message);
            return [];
        }

        return data?.map((row: any) => JSON.parse(row.data) as HistoryItem) || [];
    } catch (e) {
        console.error("Exception chargement historique:", e);
        return [];
    }
};

export const addToHistory = async (userId: string, item: HistoryItem) => {
    try {
        const { error } = await from('user_histories').insert({
            user_id: userId,
            data: item
        });
        
        if (error) {
            console.error("Erreur sauvegarde historique:", error.message);
        }
    } catch (e) {
        console.error("Exception sauvegarde historique:", e);
    }
};

export const removeFromHistory = async (userId: string, itemId: string) => {
    try {
        // For SQLite, we need to fetch and filter manually since JSON path queries are different
        const { data, error: fetchError } = await from('user_histories')
            .select('id, data')
            .eq('user_id', userId)
            .execute();
            
        if (fetchError || !data) {
            console.error("Erreur récupération historique pour suppression:", fetchError?.message);
            return;
        }
        
        // Find the item with matching ID in the data JSON
        const itemToDelete = data.find((row: any) => {
            try {
                const parsed = JSON.parse(row.data);
                return parsed.id === itemId;
            } catch {
                return false;
            }
        });
        
        if (itemToDelete) {
            const { error } = await from('user_histories')
                .eq('id', itemToDelete.id)
                .delete();
            if (error) {
                console.error("Erreur suppression historique:", error.message);
            }
        }
    } catch (e) {
        console.error("Exception suppression historique:", e);
    }
};
