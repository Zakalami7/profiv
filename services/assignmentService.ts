
import { supabase } from './supabaseClient';
import type { Exercise, ExerciseOptions } from '../types';

// CONFORMITÉ CNDP (Loi 09-08) :
// Durée de rétention des données limitée à 30 jours.
const DATA_RETENTION_DAYS = 30;

export const createAssignment = async (
    exercises: Exercise[], 
    options: ExerciseOptions, 
    userId: string
): Promise<string | null> => {
    if (!supabase) return null;

    // Générer un code unique court (ex: PHY-882)
    const prefix = options.subject.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const code = `${prefix}-${randomNum}`;

    try {
        const { error } = await supabase
            .from('assignments')
            .insert({
                code: code,
                content: exercises,
                options: options,
                // Supabase gère created_at, nous gérerons l'expiration à la lecture
            });

        if (error) {
            console.error("Erreur Supabase (Création Devoir):", error.message);
            if (error.code === '23505') {
                return createAssignment(exercises, options, userId);
            }
            return null;
        }

        return code;
    } catch (e) {
        console.error("Exception création devoir:", e);
        return null;
    }
};

export const getAssignmentByCode = async (code: string): Promise<{ exercises: Exercise[], options: ExerciseOptions, isQuiz: boolean } | null> => {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('assignments')
            .select('content, options, created_at')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !data) {
            console.warn("Devoir introuvable ou erreur:", error?.message);
            return null;
        }

        // VÉRIFICATION CONFORMITÉ : Expiration des données
        const createdDate = new Date(data.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > DATA_RETENTION_DAYS) {
            console.warn("Ce devoir a expiré conformément à la politique de rétention des données.");
            return null; // Le devoir n'est plus accessible (Droit à l'oubli)
        }

        // DÉTECTION AUTOMATIQUE : Est-ce un Quiz Interactif ?
        // On regarde si le contenu (Exercise[]) contient du JSON parsable dans 'enonce'
        // C'est le hack qu'on a utilisé dans ExamPreparation pour stocker les questions
        let isQuiz = false;
        if (data.content && Array.isArray(data.content) && data.content.length > 0) {
            const firstEx = data.content[0];
            if (firstEx.title === "Quiz Live" || (firstEx.enonce && firstEx.enonce.trim().startsWith('['))) {
                isQuiz = true;
            }
        }

        return {
            exercises: data.content as Exercise[],
            options: data.options as ExerciseOptions,
            isQuiz: isQuiz
        };
    } catch (e) {
        console.error("Erreur récupération devoir:", e);
        return null;
    }
};

// --- QUIZ LIVE & SUBMISSIONS ---

export interface StudentSubmission {
    student_name: string;
    score: number;
    total_questions: number;
    created_at: string;
}

export const submitStudentQuiz = async (code: string, studentName: string, score: number, total: number, details: any) => {
    if (!supabase) {
        console.warn("Envoi annulé : Supabase non configuré.");
        return false;
    }
    try {
        console.log(`Envoi résultat pour ${studentName} (Code: ${code})...`);
        const { error } = await supabase.from('quiz_submissions').insert({
            assignment_code: code.toUpperCase(),
            student_name: studentName,
            score: score, // Peut être -1 ou 0 si non noté
            total_questions: total,
            details: details
        });
        if (error) {
            console.error("Erreur Supabase Insert:", error);
            throw error;
        }
        console.log("Résultat envoyé avec succès !");
        return true;
    } catch (e) {
        console.error("Exception lors de la soumission du quiz:", e);
        return false;
    }
};

export const getQuizSubmissions = async (code: string): Promise<StudentSubmission[]> => {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('quiz_submissions')
            .select('student_name, score, total_questions, created_at')
            .eq('assignment_code', code.toUpperCase())
            .order('score', { ascending: false });

        if (error) {
            if (error.code === '42P01') console.warn("Table quiz_submissions manquante.");
            return [];
        }
        
        return data as StudentSubmission[];
    } catch (e) {
        return [];
    }
};
