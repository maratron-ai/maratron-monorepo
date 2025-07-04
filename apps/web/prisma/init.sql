-- Database initialization script for Docker PostgreSQL
-- This script runs automatically when the PostgreSQL container starts for the first time

-- Ensure the database exists (though it should be created by POSTGRES_DB)
SELECT 'CREATE DATABASE maratrondb'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'maratrondb')\gexec

-- Set connection to the correct database
\c maratrondb;

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a simple health check table
CREATE TABLE IF NOT EXISTS _health_check (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'ok'
);

-- Insert a health check record
INSERT INTO _health_check (status) VALUES ('initialized') ON CONFLICT DO NOTHING;

-- Note: Prisma will handle the actual schema creation via migrations
-- This init script just ensures the database is ready for Prisma