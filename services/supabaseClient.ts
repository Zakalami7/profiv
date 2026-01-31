
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION DU BACKEND ---
const SUPABASE_URL_MANUAL = 'https://fwzdtebmbamovyoofrru.supabase.co';
const SUPABASE_KEY_MANUAL = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3emR0ZWJtYmFtb3Z5b29mcnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDc4MjMsImV4cCI6MjA4NTEyMzgyM30.YBnjv6dsgWfTHuMKGt9BctoqZasr-LMvu5D1xyt4ajE';

// Fonction utilitaire pour récupérer les variables d'environnement sans faire planter le navigateur
const getEnv = (key: string) => {
  try {
    // Check for process.env in a safe way that doesn't throw ReferenceError
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    // Check for Vite's import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

// Tentative de récupération via variables d'environnement (Prioritaire)
const envUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');

// Sélection finale des clés
const supabaseUrl = envUrl || SUPABASE_URL_MANUAL;
const supabaseAnonKey = envKey || SUPABASE_KEY_MANUAL;

// Création du client uniquement si les clés sont présentes
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
    console.info(
        "%c[Profi Info]%c Backend Supabase non détecté. Mode 'Local Storage' activé.", 
        "color: orange; font-weight: bold;", 
        "color: inherit;"
    );
}
