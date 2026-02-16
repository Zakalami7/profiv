import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Exercise, ExerciseOptions, UserState, ExamEvent, HistoryItem } from '../types';

interface ExerciseStore {
  // Exercise state
  exercises: Exercise[] | null;
  setExercises: (exercises: Exercise[] | null) => void;
  
  // Options state
  options: ExerciseOptions;
  setOptions: (options: ExerciseOptions) => void;
  updateOption: <K extends keyof ExerciseOptions>(key: K, value: ExerciseOptions[K]) => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Error state
  error: string | null;
  setError: (error: string | null) => void;
  
  // History state
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  
  // Calendar events state
  calendarEvents: ExamEvent[];
  addCalendarEvent: (event: ExamEvent) => void;
  removeCalendarEvent: (id: string) => void;
  
  // User state
  userState: UserState;
  setUserState: (state: UserState) => void;
  updateUserState: <K extends keyof UserState>(key: K, value: UserState[K]) => void;
  
  // UI state
  activeTab: 'GENERATOR' | 'PREPARATION' | 'HISTORY';
  setActiveTab: (tab: 'GENERATOR' | 'PREPARATION' | 'HISTORY') => void;
  
  // Toast notifications
  toasts: Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

const defaultUserState: UserState = {
  plan: 'TEACHER_FREE',
  role: 'TEACHER',
  dailyCredits: 3,
  maxDailyCredits: 3,
  lastRefillDate: new Date().toDateString(),
  features: {
    canExportWord: false,
    maxDailyCredits: 3,
    accessRevision: true,
    hasNoWatermark: false,
    canGenerateExercises: true,
    canAccessDetailedCorrections: false,
  },
};

export const useExerciseStore = create<ExerciseStore>()(
  immer((set) => ({
    exercises: null,
    setExercises: (exercises) =>
      set((state) => {
        state.exercises = exercises;
      }),

    options: {
      level: '2ème Année Bac - Sciences Physiques / SVT',
      subject: 'Physique',
      chapter: 'Ondes mécaniques progressives',
      selectedChapters: [],
      difficulty: 'Intermédiaire',
      type: 'Exercice à développer',
      objective: 'Raisonnement scientifique',
      includeIllustration: true,
      useAI: true,
      professorName: '',
      schoolName: '',
      includeOfficialHeader: true,
      exerciseCount: 3,
      includeCorrigé: true,
      includeResponseElements: true,
      includeIllustrations: true,
      includeMinistryHeader: true,
    },
    setOptions: (options) =>
      set((state) => {
        state.options = options;
      }),
    updateOption: (key, value) =>
      set((state) => {
        (state.options as any)[key] = value;
      }),

    isLoading: false,
    setIsLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    error: null,
    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    history: [],
    addToHistory: (item) =>
      set((state) => {
        state.history.unshift(item);
        // Keep only last 50 items
        if (state.history.length > 50) {
          state.history.pop();
        }
      }),
    removeFromHistory: (id) =>
      set((state) => {
        state.history = state.history.filter((item) => item.id !== id);
      }),
    clearHistory: () =>
      set((state) => {
        state.history = [];
      }),

    calendarEvents: [],
    addCalendarEvent: (event) =>
      set((state) => {
        state.calendarEvents.push(event);
      }),
    removeCalendarEvent: (id) =>
      set((state) => {
        state.calendarEvents = state.calendarEvents.filter((e) => e.id !== id);
      }),

    userState: defaultUserState,
    setUserState: (state) =>
      set((storeState) => {
        storeState.userState = state;
      }),
    updateUserState: (key, value) =>
      set((state) => {
        (state.userState as any)[key] = value;
      }),

    activeTab: 'GENERATOR',
    setActiveTab: (tab) =>
      set((state) => {
        state.activeTab = tab;
      }),

    toasts: [],
    addToast: (type, message) =>
      set((state) => {
        const id = Math.random().toString(36).substr(2, 9);
        state.toasts.push({ id, type, message });
        // Auto-remove toast after 5 seconds
        setTimeout(() => {
          set((s) => {
            s.toasts = s.toasts.filter((t) => t.id !== id);
          });
        }, 5000);
      }),
    removeToast: (id) =>
      set((state) => {
        state.toasts = state.toasts.filter((t) => t.id !== id);
      }),
  }))
);
