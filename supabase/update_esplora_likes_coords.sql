-- Update esplora_likes to support coordinate-based pins
ALTER TABLE esplora_likes ADD COLUMN IF NOT EXISTS pos_x NUMERIC DEFAULT 50;
ALTER TABLE esplora_likes ADD COLUMN IF NOT EXISTS pos_y NUMERIC DEFAULT 90;

-- Update toggle_esplora_like RPC if it exists to handle coordinates
-- For now, we will handle position directly via Supabase client for simplicity
-- if we need to update the RPC, we would do it here.
