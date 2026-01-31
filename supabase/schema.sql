
-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLE PROFILES (Liée aux utilisateurs authentifiés)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  plan text default 'FREE', -- 'FREE', 'STUDENT_PRO', 'TEACHER_PRO'
  daily_credits integer default 3,
  last_refill_date date default current_date,
  preferred_cycle text,
  school_name text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Sécurité (RLS) pour Profiles
alter table public.profiles enable row level security;

create policy "Lecture publique de son propre profil" on public.profiles
  for select using (auth.uid() = id);

create policy "Mise à jour par l'utilisateur (champs limités)" on public.profiles
  for update using (auth.uid() = id);

-- 3. TABLE SYSTEM_CONFIG (Pour la maintenance et le programme scolaire)
create table if not exists public.system_config (
  id integer primary key generated always as identity,
  maintenance_mode boolean default false,
  global_announcement text,
  ai_model text default 'gemini-2.5-flash',
  curriculum_json jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Sécurité pour System Config
alter table public.system_config enable row level security;

create policy "Tout le monde peut lire la config" on public.system_config
  for select using (true);

-- Initialisation de la config (une seule ligne)
insert into public.system_config (maintenance_mode, global_announcement)
values (false, null)
on conflict do nothing;

-- 4. TABLE EXERCISE_CACHE (Cache des exercices IA pour économiser les coûts)
create table if not exists public.exercise_cache (
  signature text primary key,
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.exercise_cache enable row level security;

create policy "Lecture cache publique" on public.exercise_cache 
  for select using (true);

create policy "Insertion cache authentifiée" on public.exercise_cache 
  for insert with check (auth.role() = 'authenticated');

-- 5. TABLE USER_HISTORIES (Historique personnel)
create table if not exists public.user_histories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  data jsonb not null, -- Contient l'exercice complet et les options
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.user_histories enable row level security;

create policy "Gestion historique personnel" on public.user_histories
  for all using (auth.uid() = user_id);

-- 6. TABLE ASSIGNMENTS (Devoirs partagés par les profs)
create table if not exists public.assignments (
  code text primary key, -- ex: PHY-123
  content jsonb not null,
  options jsonb,
  created_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.assignments enable row level security;

create policy "Lecture devoir par code (Public)" on public.assignments 
  for select using (true);

create policy "Création devoir (Profs uniquement)" on public.assignments 
  for insert with check (auth.role() = 'authenticated');

-- 7. TABLE QUIZ_SUBMISSIONS (Réponses des élèves)
create table if not exists public.quiz_submissions (
  id uuid default uuid_generate_v4() primary key,
  assignment_code text references public.assignments(code),
  student_name text,
  score integer,
  total_questions integer,
  details jsonb, -- Réponses détaillées
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.quiz_submissions enable row level security;

create policy "Insertion soumission (Élèves)" on public.quiz_submissions 
  for insert with check (true);

create policy "Lecture soumissions (Prof créateur du devoir)" on public.quiz_submissions
  for select using (
    exists (
      select 1 from public.assignments 
      where public.assignments.code = quiz_submissions.assignment_code 
      and public.assignments.created_by = auth.uid()
    )
  );

-- 8. TRIGGER : Création automatique du profil à l'inscription
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, preferred_cycle, school_name)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'preferred_cycle', 
    new.raw_user_meta_data->>'school_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Suppression du trigger s'il existe déjà pour éviter les erreurs de migration
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
