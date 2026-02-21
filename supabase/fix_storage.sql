-- Fix Storage Permissions
-- Run this in Supabase SQL Editor to fix photo uploads

-- 1. Reset policies for storage.objects
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;

-- 2. Allow public read access to 'photos' bucket
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'photos' );

-- 3. Allow authenticated users to upload to their own folder (UUID/filename)
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'photos' AND name LIKE (auth.uid() || '/%') );

-- 4. Allow authenticated users to update their own files
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'photos' AND name LIKE (auth.uid() || '/%') );

-- 5. Explicitly allow DELETE (just in case)
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'photos' AND name LIKE (auth.uid() || '/%') );
