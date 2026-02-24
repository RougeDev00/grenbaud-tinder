DROP POLICY IF EXISTS "Utenti vedono le proprie notifiche" ON public.notifications;
CREATE POLICY "Utenti vedono le proprie notifiche" ON public.notifications FOR SELECT USING (true);
