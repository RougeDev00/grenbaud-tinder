-- Script to add DELETE policy for esplora_posts
-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own esplora posts"
    ON public.esplora_posts
    FOR DELETE
    USING (auth.uid() = user_id);
