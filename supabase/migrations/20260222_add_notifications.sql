-- Create enum for notification types 
CREATE TYPE notification_type AS ENUM ('SPY', 'EVENT_REQUEST', 'EVENT_ACCEPT', 'EVENT_REJECT');

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- chi ha causato la notifica (es. chi ti ha spiato o chi ha richiesto l'evento)
    type notification_type NOT NULL,
    reference_id UUID, -- es. l'id dell'evento, o l'id della request
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies

-- Gli utenti possono vedere solo le proprie notifiche
CREATE POLICY "Utenti vedono le proprie notifiche"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Gli utenti possono aggiornare solo le proprie notifiche (es. per segnare come letto)
CREATE POLICY "Utenti aggiornano le proprie notifiche"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Gli utenti possono cancellare solo le proprie notifiche
CREATE POLICY "Utenti cancellano le proprie notifiche"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Il sistema (attraverso l'API/service role) può inserire notifiche, o anche gli utenti (es. un utente fa una richiesta e inserisce la notifica all'host)
-- Per sicurezza base permettiamo a un utente autenticato di inserire (visto che l'app client crea le notifiche per ora)
CREATE POLICY "Utenti inseriscono notifiche"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for faster querying by user_id
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
