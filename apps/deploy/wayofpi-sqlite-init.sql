-- Way of Pi SQLite Database Initialization
-- For client demo deployment and local development

-- Enable foreign keys and create schema
PRAGMA foreign_keys = OFF;

-- Create admin users table (for portal authentication)
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,  -- In production, use bcrypt/hashing
    role TEXT NOT NULL DEFAULT 'worker',  -- 'lead' or 'worker'
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create sample users for demo
INSERT OR IGNORE INTO admin_users (username, password_hash, role, phone, email) VALUES
    ('alice_w', 'hashed-password-alice', 'lead', '+1-555-0101', 'alice@example.com'),
    ('bob_w', 'hashed-password-bob', 'worker', '+1-555-0102', 'bob@example.com'),
    ('carol_w', 'hashed-password-carol', 'worker', '+1-555-0103', 'carol@example.com');

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'worker',  -- 'lead' or 'worker'
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create time entries table
CREATE TABLE IF NOT EXISTS time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    hours REAL NOT NULL,
    project_id INTEGER,
    project_name TEXT,  -- Link to projects table for project selection
    description TEXT,
    task_id INTEGER,    -- Link to tasks table
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,         -- For leader feedback
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT NOT NULL,  -- User ID or 'unassigned'
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'complete', 'cancelled')),
    estimated_hours REAL,
    actual_hours REAL,
    start_date DATE,
    due_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT 1
);

-- Insert sample projects
INSERT OR IGNORE INTO projects (name, active) VALUES
    ('Client Demo', 1),
    ('Documentation Phase', 1),
    ('Development Sprint', 1);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Create table for work mode settings (leader toggle)
CREATE TABLE IF NOT EXISTS work_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    current_user_leading INTEGER DEFAULT 0,  -- Whether current user is pretending to be leader
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT OR IGNORE INTO work_settings (id, current_user_leading) VALUES (1, 0);

PRAGMA foreign_keys = ON;

-- Insert sample time entries for demo
INSERT INTO time_entries (user_id, date, hours, project_id, project_name, description, status, task_id) VALUES
    ('bob_w', '2026-05-04', 4.5, 1, 'Client Demo', 'Implemented docs UI mode', 'approved', NULL),
    ('carol_w', '2026-05-04', 5.0, 1, 'Client Demo', 'Code reviews and testing', 'approved', NULL),
    ('bob_w', '2026-05-05', 6.0, 2, 'Documentation Phase', 'Drafting PRD documentation', 'pending', 1),
    ('carol_w', '2026-05-05', 4.0, 1, 'Client Demo', 'Fixing UI issues', 'pending', 2),
    ('bob_w', '2026-05-06', 0.0, 1, 'Client Demo', 'Waiting for client feedback', 'pending', NULL);

-- Insert sample tasks for demo
INSERT INTO tasks (title, description, assigned_to, status, estimated_hours, actual_hours, due_date) VALUES
    ('Draft PRD documentation', 'Create initial PRD for client demo', 'bob_w', 'in_progress', 5.0, NULL, '2026-05-06'),
    ('Fix UI button issues', 'Fix docs mode button layout', 'carol_w', 'in_progress', 3.0, NULL, '2026-05-05'),
    ('Review and approve time entries', 'Admin task to review submissions', 'alice_w', 'complete', 1.0, 0.5, '2026-05-04'),
    ('Prepare demo presentation', 'Create presentation for client meeting', 'unassigned', 'draft', 4.0, NULL, '2026-05-07');

-- Create portal auth tokens table (simplified)
CREATE TABLE IF NOT EXISTS portal_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    is_valid INTEGER DEFAULT 1,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo valid token
INSERT OR IGNORE INTO portal_tokens (token, is_valid, expires_at) VALUES
    ('worker-portal-token-secret', 1, '2030-01-01');
