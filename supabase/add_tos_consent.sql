-- Add tos_accepted column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tos_accepted BOOLEAN DEFAULT FALSE;

-- Update RLS if necessary (though existing policies usually cover columns)
-- No changes needed to RLS for adding a column.
