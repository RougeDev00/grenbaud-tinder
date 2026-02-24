-- Add new value 'SPY_RECIPROCAL' to existing notification_type enum to support mutual compatibility notifications
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'SPY_RECIPROCAL';
