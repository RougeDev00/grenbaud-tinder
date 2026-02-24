-- =============================================
-- Fix 1: Revoke excessive GRANT ALL from anon role
-- =============================================

-- Revoke ALL from anon on all tables (nuclear reset)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Re-grant only SELECT where public access is needed
-- (these tables have RLS policies with "TO public" for SELECT)
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON event_participants TO anon;
GRANT SELECT ON esplora_posts TO anon;
GRANT SELECT ON esplora_likes TO anon;

-- Authenticated users keep full DML (RLS controls the rest)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
