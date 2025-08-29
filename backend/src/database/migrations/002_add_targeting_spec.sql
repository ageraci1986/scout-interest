-- Add targeting_spec column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS targeting_spec JSONB;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_targeting_spec ON projects USING GIN (targeting_spec);
