-- Admin Analytics Migration
-- Tracks mastering exports and provides analytics views for admin dashboard

-- 1. Create mastering_exports table to track export completions
CREATE TABLE IF NOT EXISTS public.mastering_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.audio_sessions(id) ON DELETE CASCADE,
    export_format TEXT NOT NULL,
    file_size BIGINT,
    loudness_target TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create export_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.audio_sessions(id) ON DELETE SET NULL,
    export_id UUID REFERENCES public.mastering_exports(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    export_format TEXT,
    file_size BIGINT,
    status TEXT NOT NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mastering_exports_user_id ON public.mastering_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_mastering_exports_session_id ON public.mastering_exports(session_id);
CREATE INDEX IF NOT EXISTS idx_mastering_exports_created_at ON public.mastering_exports(created_at);
CREATE INDEX IF NOT EXISTS idx_export_logs_user_id ON public.export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_created_at ON public.export_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_export_logs_status ON public.export_logs(status);

-- 4. Enable RLS
ALTER TABLE public.mastering_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "users_manage_own_mastering_exports" ON public.mastering_exports;
CREATE POLICY "users_manage_own_mastering_exports"
ON public.mastering_exports
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_view_own_export_logs" ON public.export_logs;
CREATE POLICY "users_view_own_export_logs"
ON public.export_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "system_insert_export_logs" ON public.export_logs;
CREATE POLICY "system_insert_export_logs"
ON public.export_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 6. Create analytics functions for admin dashboard

-- Function to get active users count with date filter
CREATE OR REPLACE FUNCTION public.get_active_users_count(
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_count INTEGER;
BEGIN
    IF start_date IS NULL AND end_date IS NULL THEN
        -- All time active users (users with any activity)
        SELECT COUNT(DISTINCT user_id) INTO user_count
        FROM public.audio_sessions;
    ELSE
        -- Active users within date range
        SELECT COUNT(DISTINCT user_id) INTO user_count
        FROM public.audio_sessions
        WHERE (start_date IS NULL OR created_at >= start_date)
          AND (end_date IS NULL OR created_at <= end_date);
    END IF;
    
    RETURN COALESCE(user_count, 0);
END;
$$;

-- Function to get recording sessions completed count with date filter
CREATE OR REPLACE FUNCTION public.get_completed_sessions_count(
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count
    FROM public.audio_sessions
    WHERE status = 'completed'::session_status
      AND (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date);
    
    RETURN COALESCE(session_count, 0);
END;
$$;

-- Function to get projects created count with date filter
CREATE OR REPLACE FUNCTION public.get_projects_created_count(
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO project_count
    FROM public.audio_sessions
    WHERE (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date);
    
    RETURN COALESCE(project_count, 0);
END;
$$;

-- Function to get mastering exports completed count with date filter
CREATE OR REPLACE FUNCTION public.get_mastering_exports_count(
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    export_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO export_count
    FROM public.mastering_exports
    WHERE (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date);
    
    RETURN COALESCE(export_count, 0);
END;
$$;

-- Function to get export logs with date filter for CSV export
CREATE OR REPLACE FUNCTION public.get_export_logs_for_admin(
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL,
    limit_count INTEGER DEFAULT 100
)
RETURNS TABLE(
    id UUID,
    user_email TEXT,
    session_title TEXT,
    action TEXT,
    export_format TEXT,
    file_size BIGINT,
    status TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        el.id,
        up.email::TEXT,
        COALESCE(asess.title, 'N/A')::TEXT,
        el.action::TEXT,
        el.export_format::TEXT,
        el.file_size,
        el.status::TEXT,
        el.error_message::TEXT,
        el.created_at
    FROM public.export_logs el
    LEFT JOIN public.user_profiles up ON el.user_id = up.id
    LEFT JOIN public.audio_sessions asess ON el.session_id = asess.id
    WHERE (start_date IS NULL OR el.created_at >= start_date)
      AND (end_date IS NULL OR el.created_at <= end_date)
    ORDER BY el.created_at DESC
    LIMIT limit_count;
END;
$$;

-- 7. Create mock data for testing
DO $$
DECLARE
    existing_user_id UUID;
    existing_session_id UUID;
    export_id_1 UUID := gen_random_uuid();
    export_id_2 UUID := gen_random_uuid();
BEGIN
    -- Get existing user and session
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) THEN
        SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
        
        IF existing_user_id IS NOT NULL THEN
            -- Get existing session
            SELECT id INTO existing_session_id 
            FROM public.audio_sessions 
            WHERE user_id = existing_user_id 
            LIMIT 1;
            
            IF existing_session_id IS NOT NULL THEN
                -- Create sample mastering exports
                INSERT INTO public.mastering_exports (id, user_id, session_id, export_format, file_size, loudness_target, created_at)
                VALUES 
                    (export_id_1, existing_user_id, existing_session_id, 'wav', 5242880, 'streaming', NOW() - INTERVAL '2 days'),
                    (export_id_2, existing_user_id, existing_session_id, 'mp3', 3145728, 'loud', NOW() - INTERVAL '1 day')
                ON CONFLICT (id) DO NOTHING;
                
                -- Create sample export logs
                INSERT INTO public.export_logs (user_id, session_id, export_id, action, export_format, file_size, status, created_at)
                VALUES 
                    (existing_user_id, existing_session_id, export_id_1, 'export_completed', 'wav', 5242880, 'success', NOW() - INTERVAL '2 days'),
                    (existing_user_id, existing_session_id, export_id_2, 'export_completed', 'mp3', 3145728, 'success', NOW() - INTERVAL '1 day'),
                    (existing_user_id, existing_session_id, NULL, 'export_started', 'wav', NULL, 'processing', NOW() - INTERVAL '3 hours')
                ON CONFLICT (id) DO NOTHING;
            ELSE
                RAISE NOTICE 'No existing sessions found for mock export data';
            END IF;
        ELSE
            RAISE NOTICE 'No existing users found for mock export data';
        END IF;
    ELSE
        RAISE NOTICE 'Table user_profiles does not exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock export data insertion failed: %', SQLERRM;
END $$;
