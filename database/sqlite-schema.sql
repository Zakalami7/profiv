-- ============================================
-- ProfiV SQLite Database Schema
-- Migration from Supabase PostgreSQL
-- ============================================

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- ============================================
-- 1. TABLE: profiles
-- Replaces: public.profiles (linked to auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,                    -- UUID as TEXT (was: uuid references auth.users)
    email TEXT,
    plan TEXT DEFAULT 'FREE',               -- 'FREE', 'STUDENT_PRO', 'TEACHER_PRO'
    daily_credits INTEGER DEFAULT 3,
    last_refill_date TEXT DEFAULT (date('now')),  -- ISO date string
    preferred_cycle TEXT,
    school_name TEXT,
    full_name TEXT,
    subscription_end_date TEXT,             -- ISO datetime string
    role TEXT DEFAULT 'STUDENT',            -- 'TEACHER', 'STUDENT'
    created_at TEXT DEFAULT (datetime('now'))       -- ISO datetime string
);

-- Index for email lookups (common auth pattern)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

-- ============================================
-- 2. TABLE: system_config
-- Replaces: public.system_config
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    maintenance_mode INTEGER DEFAULT 0,     -- Boolean: 0=false, 1=true
    global_announcement TEXT,
    ai_model TEXT DEFAULT 'gemini-2.5-flash',
    curriculum_json TEXT,                   -- JSON stored as TEXT
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Initialize with default config (only one row allowed)
INSERT INTO system_config (id, maintenance_mode, global_announcement)
VALUES (1, 0, NULL)
ON CONFLICT(id) DO NOTHING;

-- ============================================
-- 3. TABLE: exercise_cache
-- Replaces: public.exercise_cache
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_cache (
    signature TEXT PRIMARY KEY,             -- Cache key hash
    content TEXT NOT NULL,                  -- JSON exercises array
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT                         -- Optional expiration
);

-- Index for expiration queries
CREATE INDEX IF NOT EXISTS idx_exercise_cache_expires ON exercise_cache(expires_at);

-- ============================================
-- 4. TABLE: user_histories
-- Replaces: public.user_histories
-- ============================================
CREATE TABLE IF NOT EXISTS user_histories (
    id TEXT PRIMARY KEY,                    -- UUID as TEXT
    user_id TEXT NOT NULL,                  -- References profiles.id
    data TEXT NOT NULL,                     -- JSON HistoryItem
    created_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Index for user history queries
CREATE INDEX IF NOT EXISTS idx_user_histories_user_id ON user_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_histories_created_at ON user_histories(created_at);

-- ============================================
-- 5. TABLE: assignments
-- Replaces: public.assignments
-- CNDP Compliance: 30-day data retention
-- ============================================
CREATE TABLE IF NOT EXISTS assignments (
    code TEXT PRIMARY KEY,                  -- Ex: PHY-882
    content TEXT NOT NULL,                  -- JSON Exercise[]
    options TEXT,                           -- JSON ExerciseOptions
    created_by TEXT,                        -- References profiles.id
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,                        -- Auto-calculated: created_at + 30 days
    
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index for code lookups
CREATE INDEX IF NOT EXISTS idx_assignments_code ON assignments(code);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_expires ON assignments(expires_at);

-- ============================================
-- 6. TABLE: quiz_submissions
-- Replaces: public.quiz_submissions
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id TEXT PRIMARY KEY,                    -- UUID as TEXT
    assignment_code TEXT NOT NULL,          -- References assignments.code
    student_name TEXT,
    score INTEGER,
    total_questions INTEGER,
    details TEXT,                           -- JSON detailed answers
    created_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (assignment_code) REFERENCES assignments(code) ON DELETE CASCADE
);

-- Index for assignment lookups
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_assignment ON quiz_submissions(assignment_code);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_score ON quiz_submissions(score);

-- ============================================
-- 7. TABLE: auth_users (Custom auth replacement)
-- Replaces: auth.users from Supabase
-- ============================================
CREATE TABLE IF NOT EXISTS auth_users (
    id TEXT PRIMARY KEY,                    -- UUID
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,            -- bcrypt hash
    email_confirmed INTEGER DEFAULT 0,      -- Boolean: 0=false, 1=true
    raw_user_meta_data TEXT,                -- JSON: preferred_cycle, school_name, etc.
    created_at TEXT DEFAULT (datetime('now')),
    last_sign_in_at TEXT
);

-- Index for email authentication
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);

-- ============================================
-- Performance Optimizations
-- ============================================

-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Set cache size (in pages, default page size is 4096 bytes)
-- 2000 pages = ~8MB cache
PRAGMA cache_size = 2000;

-- Set synchronous mode to NORMAL for performance/safety balance
PRAGMA synchronous = NORMAL;

-- Enable memory-mapped I/O for read-heavy workloads
PRAGMA mmap_size = 30000000000;  -- 30GB limit (SQLite will use what it needs)

-- ============================================
-- Views for Common Queries
-- ============================================

-- View: Active assignments (not expired)
CREATE VIEW IF NOT EXISTS active_assignments AS
SELECT * FROM assignments 
WHERE expires_at IS NULL OR expires_at > datetime('now');

-- View: User profile with auth info
CREATE VIEW IF NOT EXISTS user_profiles_complete AS
SELECT 
    p.*,
    au.email as auth_email,
    au.email_confirmed,
    au.last_sign_in_at
FROM profiles p
LEFT JOIN auth_users au ON p.id = au.id;

-- ============================================
-- Triggers for Data Management
-- ============================================

-- Trigger: Auto-set expiration date for assignments (30 days)
CREATE TRIGGER IF NOT EXISTS trg_assignments_set_expiration
AFTER INSERT ON assignments
BEGIN
    UPDATE assignments 
    SET expires_at = datetime(NEW.created_at, '+30 days')
    WHERE code = NEW.code AND expires_at IS NULL;
END;

-- Trigger: Clean up expired assignments (CNDP compliance)
CREATE TRIGGER IF NOT EXISTS trg_assignments_cleanup_expired
AFTER SELECT ON assignments
BEGIN
    DELETE FROM assignments 
    WHERE expires_at < datetime('now');
END;

-- ============================================
-- Initial Data (Optional)
-- ============================================

-- Default curriculum will be loaded from constants.ts
-- No initial data required for fresh setup
