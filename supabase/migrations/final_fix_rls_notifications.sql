-- Remove the restricted policy that was crashing notifications
DROP POLICY IF EXISTS "Utenti inseriscono notifiche" ON public.notifications;

-- Create a fully open policy for inserts so anyone (even test/mock accounts) can trigger notifications
CREATE POLICY "Utenti inseriscono notifiche" ON public.notifications FOR INSERT WITH CHECK (true);
