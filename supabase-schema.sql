-- Scout Interest Database Schema for Supabase
-- Execute this script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id VARCHAR(255) DEFAULT 'anonymous',
    status VARCHAR(50) DEFAULT 'active',
    total_postal_codes INTEGER DEFAULT 0,
    processed_postal_codes INTEGER DEFAULT 0,
    error_postal_codes INTEGER DEFAULT 0,
    targeting_spec JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create processing_results table
CREATE TABLE IF NOT EXISTS processing_results (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    postal_code VARCHAR(20) NOT NULL,
    country_code VARCHAR(10) DEFAULT 'US',
    zip_data JSONB,
    postal_code_only_estimate JSONB,
    postal_code_with_targeting_estimate JSONB,
    targeting_spec JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_processing_results_project_id ON processing_results(project_id);
CREATE INDEX IF NOT EXISTS idx_processing_results_postal_code ON processing_results(postal_code);
CREATE INDEX IF NOT EXISTS idx_projects_targeting_spec ON projects USING GIN (targeting_spec);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for projects table
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO projects (name, description, user_id, total_postal_codes) 
VALUES ('Sample Project', 'Sample project for testing', 'anonymous', 10)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for future use
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_results ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for now)
CREATE POLICY "Allow all operations on projects" ON projects
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on processing_results" ON processing_results
    FOR ALL USING (true);
