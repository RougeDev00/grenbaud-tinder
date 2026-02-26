-- Add MATCH notification type for mutual compatibility detection
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'MATCH';
