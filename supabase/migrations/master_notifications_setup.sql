-- 1. Create the enum type if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('SPY', 'EVENT_REQUEST', 'EVENT_ACCEPT', 'EVENT_REJECT', 'EVENT_REMOVE');
    END IF;
END$$;

-- 2. Add any missing enum values if the type already existed from an older version
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'EVENT_REMOVE';

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, 
    type notification_type NOT NULL,
    reference_id UUID, 
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Turn on Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Utenti vedono le proprie notifiche" ON public.notifications;
CREATE POLICY "Utenti vedono le proprie notifiche" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utenti aggiornano le proprie notifiche" ON public.notifications;
CREATE POLICY "Utenti aggiornano le proprie notifiche" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utenti cancellano le proprie notifiche" ON public.notifications;
CREATE POLICY "Utenti cancellano le proprie notifiche" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Utenti inseriscono notifiche" ON public.notifications;
CREATE POLICY "Utenti inseriscono notifiche" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- 7. Enable real-time updates for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
