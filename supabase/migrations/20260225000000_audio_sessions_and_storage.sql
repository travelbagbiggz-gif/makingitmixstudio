-- Audio Recording Sessions Migration
-- Includes: User profiles, sessions, recordings, and storage buckets

-- 1. Types
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('free', 'premium', 'admin');

DROP TYPE IF EXISTS public.session_status CASCADE;
CREATE TYPE public.session_status AS ENUM ('draft', 'in_progress', 'completed', 'archived');

DROP TYPE IF EXISTS public.recording_type CASCADE;
CREATE TYPE public.recording_type AS ENUM ('lead', 'double', 'adlib', 'extra', 'beat');

DROP TYPE IF EXISTS public.section_type CASCADE;
CREATE TYPE public.section_type AS ENUM ('verse1', 'verse2', 'verse3', 'hook', 'bridge', 'outro');

-- 2. Core Tables
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role public.user_role DEFAULT 'free'::public.user_role,
    demos_used INTEGER DEFAULT 0,
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.audio_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status public.session_status DEFAULT 'draft'::public.session_status,
    preset TEXT DEFAULT 'hiphop',
    autotune_enabled BOOLEAN DEFAULT true,
    retune_speed INTEGER DEFAULT 50,
    beat_file_path TEXT,
    beat_duration NUMERIC,
    beat_bpm INTEGER,
    session_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.audio_sessions(id) ON DELETE CASCADE,
    section public.section_type NOT NULL,
    channel_type public.recording_type NOT NULL,
    file_path TEXT NOT NULL,
    duration NUMERIC NOT NULL,
    punch_in_time NUMERIC,
    punch_out_time NUMERIC,
    waveform_data JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_audio_sessions_user_id ON public.audio_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_sessions_status ON public.audio_sessions(status);
CREATE INDEX IF NOT EXISTS idx_recordings_session_id ON public.recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_section ON public.recordings(section);

-- 4. Functions (BEFORE RLS policies)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role, demos_used)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'free'::public.user_role),
        0
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 5. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_audio_sessions" ON public.audio_sessions;
CREATE POLICY "users_manage_own_audio_sessions"
ON public.audio_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_manage_own_recordings" ON public.recordings;
CREATE POLICY "users_manage_own_recordings"
ON public.recordings
FOR ALL
TO authenticated
USING (
    session_id IN (
        SELECT id FROM public.audio_sessions WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    session_id IN (
        SELECT id FROM public.audio_sessions WHERE user_id = auth.uid()
    )
);

-- 7. Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_audio_sessions_updated_at ON public.audio_sessions;
CREATE TRIGGER update_audio_sessions_updated_at
    BEFORE UPDATE ON public.audio_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_recordings_updated_at ON public.recordings;
CREATE TRIGGER update_recordings_updated_at
    BEFORE UPDATE ON public.recordings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-recordings',
    'audio-recordings',
    false,
    104857600, -- 100MB
    ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'session-exports',
    'session-exports',
    false,
    524288000, -- 500MB
    ARRAY['application/json', 'application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- 9. Storage RLS Policies
DROP POLICY IF EXISTS "users_manage_own_audio_recordings" ON storage.objects;
CREATE POLICY "users_manage_own_audio_recordings"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'audio-recordings' AND 
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'audio-recordings' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users_manage_own_session_exports" ON storage.objects;
CREATE POLICY "users_manage_own_session_exports"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'session-exports' AND 
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'session-exports' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 10. Mock Data
DO $$
DECLARE
    demo_user_uuid UUID := gen_random_uuid();
    demo_session_uuid UUID := gen_random_uuid();
BEGIN
    -- Create demo user (trigger creates user_profiles automatically)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES (
        demo_user_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'demo@studio.com', crypt('demo123', gen_salt('bf', 10)), now(), now(), now(),
        jsonb_build_object('full_name', 'Demo Artist', 'role', 'premium'),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
        false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create demo session
    INSERT INTO public.audio_sessions (
        id, user_id, title, description, preset, status
    ) VALUES (
        demo_session_uuid,
        demo_user_uuid,
        'My First Track',
        'Demo recording session',
        'hiphop',
        'in_progress'::public.session_status
    )
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;