-- Add new value 'EVENT_REMOVE' to existing notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'EVENT_REMOVE';
