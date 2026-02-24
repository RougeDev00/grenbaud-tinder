-- Allow users to see notifications where they are the ACTOR (the sender of the SPY/event request)
CREATE POLICY "Utenti vedono le notifiche inviate"
ON public.notifications FOR SELECT
USING (auth.uid() = actor_id);
