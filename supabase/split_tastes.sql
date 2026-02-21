-- Add columns for split tastes
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS music_artists TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS youtube_channels TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS twitch_streamers TEXT DEFAULT '';
