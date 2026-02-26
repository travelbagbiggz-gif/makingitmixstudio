-- Autotune Presets Migration
-- Stores named presets for autotune intensity, wet/dry mix, and beat volume

CREATE TABLE IF NOT EXISTS public.autotune_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    intensity INTEGER NOT NULL DEFAULT 100,
    wet_mix INTEGER NOT NULL DEFAULT 100,
    beat_volume INTEGER NOT NULL DEFAULT 80,
    retune_speed INTEGER NOT NULL DEFAULT 50,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_autotune_presets_user_id ON public.autotune_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_autotune_presets_is_default ON public.autotune_presets(user_id, is_default);

ALTER TABLE public.autotune_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_autotune_presets" ON public.autotune_presets;
CREATE POLICY "users_manage_own_autotune_presets"
ON public.autotune_presets
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS update_autotune_presets_updated_at ON public.autotune_presets;
CREATE TRIGGER update_autotune_presets_updated_at
    BEFORE UPDATE ON public.autotune_presets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
