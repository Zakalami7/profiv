
export interface Curriculum {
  [level: string]: {
    [subject: string]: string[];
  };
}

export interface ChapterConfig {
    chapter: string;
    count: number;
}

export interface ExerciseOptions {
  level: string;
  subject: string;
  chapter: string; // Chapitre principal (ou par défaut pour compatibilité)
  selectedChapters: ChapterConfig[]; // Nouvelle liste pour le multi-chapitre
  difficulty: string;
  type: string;
  objective: string;
  includeIllustration: boolean;
  useAI: boolean;
  professorName: string;
  schoolName: string;
  includeOfficialHeader: boolean;
  exerciseCount: number; // Total des exercices
  // New options for exercise generation
  includeCorrigé: boolean; // Inclure le corrigé
  includeResponseElements: boolean; // Éléments de réponse détaillés
  includeIllustrations: boolean; // 🖼️ Schémas et figures si pertinent
  includeMinistryHeader: boolean; // 🏛️ Format Ministère de l'Éducation
}

export interface Exercise {
  id?: string;
  title?: string; // Ex: "Exercice 1 (3 points)"
  enonce: string;
  corrige: string;
  illustrationSVG?: string;
}

export interface HistoryItem {
    id: string;
    timestamp: number;
    dateStr: string;
    options: ExerciseOptions;
    exercises: Exercise[];
}

// Types pour la monétisation
export type PlanType = 'TEACHER_FREE' | 'TEACHER_PRO' | 'STUDENT_FREE' | 'STUDENT_PRO' | 'STUDENT_PASS_24H' | 'STUDENT_PACK_BAC';
export type CycleType = 'PRIMAIRE' | 'COLLEGE' | 'LYCEE';
export type UserRole = 'TEACHER' | 'STUDENT';

export interface UserState {
    plan: PlanType;
    role: UserRole;
    dailyCredits: number;
    maxDailyCredits: number;
    lastRefillDate: string;
    subscriptionEndDate?: string; // For STUDENT_PASS_24H
    preferredCycle?: CycleType;
    features: {
        canExportWord: boolean;
        maxDailyCredits: number;
        accessRevision: boolean;
        hasNoWatermark: boolean;
        canGenerateExercises: boolean;
        canAccessDetailedCorrections: boolean;
    };
}

// --- Types Administrateur & Système ---

export interface AdminStats {
  totalRevenue: number;
  totalUsers: number;
  totalExercisesGenerated: number;
  activeUsersNow: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  credits: number;
  status: 'Active' | 'Banned';
  lastLogin: string;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  globalAnnouncement: string;
  allowFreeAI: boolean;
  aiModel: string; // "gemini-2.5-flash", "gemini-1.5-pro", etc.
  curriculumVersion: string;
}

export interface RateLimits {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
}

// --- Types Quiz Diagnostic ---

export interface QuizQuestion {
    id: string;
    question: string;
    choices: string[];
    correctAnswerIndex: number;
    explanation: string;
    topic: string;
}

export interface QuizAnalysis {
    score: number;
    totalQuestions: number;
    diagnosis: string;
    strengths: string[];
    weaknesses: string[];
    revisionPlan: {
        topic: string;
        action: string;
    }[];
}

// --- Structure Officielle des Examens ---
export interface OfficialExamStructure {
    components: {
        name: string;
        weight: string; // ex: "25%" ou "5 pts"
        description: string;
    }[];
    guidelines: string[];
}

// --- Événement Calendrier ---
export interface ExamEvent {
    id: number;
    title: string;
    date: string;
    type: 'NATIONAL' | 'REGIONAL' | 'CONTROLE';
    description: string;
    linkedContent?: Exercise[];
    linkedOptions?: ExerciseOptions;
}

// --- Soumission Élève ---
export interface StudentSubmission {
    student_name: string;
    score: number;
    total_questions: number;
    created_at: string;
    details: any; 
}

// --- SWOT Tool ---
export interface SWOTResult {
    synthesis: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    strategicAdvice: string;
}
