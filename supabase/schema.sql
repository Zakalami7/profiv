-- ============================================
-- ProfiV Supabase PostgreSQL Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLE: profiles
-- Linked to auth.users
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    plan TEXT DEFAULT 'FREE',
    daily_credits INTEGER DEFAULT 3,
    last_refill_date DATE DEFAULT CURRENT_DATE,
    preferred_cycle TEXT,
    school_name TEXT,
    full_name TEXT,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    role TEXT DEFAULT 'STUDENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" 
    ON public.profiles FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);

-- ============================================
-- 2. TABLE: system_config
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    global_announcement TEXT,
    ai_model TEXT DEFAULT 'gemini-2.5-flash',
    curriculum_json JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS on system_config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_config
CREATE POLICY "Anyone can view system config" 
    ON public.system_config FOR SELECT 
    TO authenticated, anon 
    USING (true);

CREATE POLICY "Service role can manage system config" 
    ON public.system_config FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Initialize with default config
INSERT INTO public.system_config (id, maintenance_mode, global_announcement)
VALUES (1, FALSE, NULL)
ON CONFLICT(id) DO NOTHING;

-- ============================================
-- 3. TABLE: exercise_cache
-- ============================================
CREATE TABLE IF NOT EXISTS public.exercise_cache (
    signature TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on exercise_cache
ALTER TABLE public.exercise_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_cache
CREATE POLICY "Anyone can view exercise cache" 
    ON public.exercise_cache FOR SELECT 
    TO authenticated, anon 
    USING (true);

CREATE POLICY "Service role can manage exercise cache" 
    ON public.exercise_cache FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Index for expiration queries
CREATE INDEX IF NOT EXISTS idx_exercise_cache_expires ON public.exercise_cache(expires_at);

-- ============================================
-- 4. TABLE: user_histories
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_histories
ALTER TABLE public.user_histories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_histories
CREATE POLICY "Users can view own history" 
    ON public.user_histories FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" 
    ON public.user_histories FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history" 
    ON public.user_histories FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" 
    ON public.user_histories FOR DELETE 
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all histories" 
    ON public.user_histories FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Index for user history queries
CREATE INDEX IF NOT EXISTS idx_user_histories_user_id ON public.user_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_histories_created_at ON public.user_histories(created_at);

-- ============================================
-- 5. TABLE: assignments
-- CNDP Compliance: 30-day data retention
-- ============================================
CREATE TABLE IF NOT EXISTS public.assignments (
    code TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    options JSONB,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Enable RLS on assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments
CREATE POLICY "Anyone can view assignments" 
    ON public.assignments FOR SELECT 
    TO authenticated, anon 
    USING (true);

CREATE POLICY "Authenticated users can create assignments" 
    ON public.assignments FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "Users can update own assignments" 
    ON public.assignments FOR UPDATE 
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own assignments" 
    ON public.assignments FOR DELETE 
    USING (auth.uid() = created_by);

CREATE POLICY "Service role can manage all assignments" 
    ON public.assignments FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Index for code lookups
CREATE INDEX IF NOT EXISTS idx_assignments_code ON public.assignments(code);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_expires ON public.assignments(expires_at);

-- ============================================
-- 6. TABLE: quiz_submissions
-- ============================================
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_code TEXT NOT NULL REFERENCES public.assignments(code) ON DELETE CASCADE,
    student_name TEXT,
    score INTEGER,
    total_questions INTEGER,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quiz_submissions
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_submissions
CREATE POLICY "Anyone can view quiz submissions" 
    ON public.quiz_submissions FOR SELECT 
    TO authenticated, anon 
    USING (true);

CREATE POLICY "Anyone can create quiz submissions" 
    ON public.quiz_submissions FOR INSERT 
    TO authenticated, anon 
    WITH CHECK (true);

CREATE POLICY "Service role can manage all quiz submissions" 
    ON public.quiz_submissions FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Index for assignment lookups
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_assignment ON public.quiz_submissions(assignment_code);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_score ON public.quiz_submissions(score);

-- ============================================
-- 7. Function: Handle new user signup
-- Creates profile when user signs up
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, plan, daily_credits, role)
    VALUES (
        NEW.id,
        NEW.email,
        'FREE',
        3,
        'STUDENT'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. Function: Clean up expired assignments
-- CNDP compliance: Auto-delete after 30 days
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_assignments()
RETURNS void AS $$
BEGIN
    DELETE FROM public.assignments 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Function: Refill daily credits
-- Resets credits for all users at midnight
-- ============================================
CREATE OR REPLACE FUNCTION public.refill_daily_credits()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET daily_credits = CASE 
        WHEN plan = 'FREE' THEN 3
        WHEN plan = 'STUDENT_PRO' THEN 50
        WHEN plan = 'TEACHER_PRO' THEN 999
        ELSE 3
    END,
    last_refill_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views for Common Queries
-- ============================================

-- View: Active assignments (not expired)
CREATE OR REPLACE VIEW public.active_assignments AS
SELECT * FROM public.assignments 
WHERE expires_at IS NULL OR expires_at > NOW();

-- View: User profile with stats
CREATE OR REPLACE VIEW public.user_profiles_complete AS
SELECT 
    p.*,
    au.email as auth_email,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase Auth';
COMMENT ON TABLE public.assignments IS 'Exercise assignments with 30-day retention (CNDP compliance)';
COMMENT ON TABLE public.quiz_submissions IS 'Student quiz submissions';
COMMENT ON TABLE public.user_histories IS 'User exercise generation history';
COMMENT ON TABLE public.exercise_cache IS 'Cached AI-generated exercises';
COMMENT ON TABLE public.system_config IS 'Global system configuration';
