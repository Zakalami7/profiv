import { from } from '../database/query-builder';
import type { Exercise, ExerciseOptions } from '../types';

// CONFORMITÉ CNDP (Loi 09-08) :
// Durée de rétention des données limitée à 30 jours.
const DATA_RETENTION_DAYS = 30;

export const createAssignment = async (
    exercises: Exercise[], 
    options: ExerciseOptions, 
    userId: string
): Promise<string | null> => {
    // Générer un code unique court (ex: PHY-882)
    const prefix = options.subject.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const code = `${prefix}-${randomNum}`;

    try {
        const { error } = await from('assignments').insert({
            code: code,
            content: exercises,
            options: options,
            created_by: userId
        });

        if (error) {
            console.error("Erreur création devoir:", error.message);
            // If duplicate code, retry
            if (error.message.includes('UNIQUE constraint failed')) {
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
    try {
        const { data, error } = await from('assignments')
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

        // Parse JSON content
        const content = typeof data.content === 'string' 
            ? JSON.parse(data.content) 
            : data.content;
        const options = typeof data.options === 'string' 
            ? JSON.parse(data.options) 
            : data.options;

        // DÉTECTION AUTOMATIQUE : Est-ce un Quiz Interactif ?
        let isQuiz = false;
        if (content && Array.isArray(content) && content.length > 0) {
            const firstEx = content[0];
            if (firstEx.title === "Quiz Live" || (firstEx.enonce && firstEx.enonce.trim().startsWith('['))) {
                isQuiz = true;
            }
        }

        return {
            exercises: content as Exercise[],
            options: options as ExerciseOptions,
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
    try {
        console.log(`Envoi résultat pour ${studentName} (Code: ${code})...`);
        const { error } = await from('quiz_submissions').insert({
            assignment_code: code.toUpperCase(),
            student_name: studentName,
            score: score,
            total_questions: total,
            details: details
        });
        if (error) {
            console.error("Erreur insertion soumission:", error);
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
    try {
        const { data, error } = await from('quiz_submissions')
            .select('student_name, score, total_questions, created_at')
            .eq('assignment_code', code.toUpperCase())
            .order('score', { ascending: false })
            .execute();

        if (error) {
            console.warn("Erreur récupération soumissions:", error.message);
            return [];
        }
        
        return (data || []) as StudentSubmission[];
    } catch (e) {
        console.error("Exception récupération soumissions:", e);
        return [];
    }
};
