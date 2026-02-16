import { useExerciseStore } from './exerciseStore';
import { useEffect } from 'react';

const STORAGE_KEY = 'profiV_exercise_store';

/**
 * Hook to persist and restore Zustand store from localStorage
 * Call this in your root component (App.tsx)
 */
export const usePersistExerciseStore = () => {
  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        useExerciseStore.setState(parsed);
      }
    } catch (error) {
      console.error('Failed to restore store from localStorage:', error);
    }
  }, []);

  // Subscribe to store changes and save to localStorage
  useEffect(() => {
    const unsubscribe = useExerciseStore.subscribe(
      (state) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
          console.error('Failed to save store to localStorage:', error);
        }
      }
    );

    return unsubscribe;
  }, []);
};

/**
 * Utility to reset store to initial state
 */
export const resetExerciseStore = () => {
  localStorage.removeItem(STORAGE_KEY);
  useExerciseStore.setState({
    exercises: null,
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
    isLoading: false,
    error: null,
    history: [],
    calendarEvents: [],
    activeTab: 'GENERATOR',
    toasts: [],
  });
};
