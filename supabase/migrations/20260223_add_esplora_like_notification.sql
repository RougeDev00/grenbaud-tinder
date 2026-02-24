-- Add new value 'ESPLORA_LIKE' to existing notification_type enum for bacheca pin notifications
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ESPLORA_LIKE';
