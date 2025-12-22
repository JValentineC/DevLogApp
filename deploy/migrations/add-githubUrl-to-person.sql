-- Migration: Add githubUrl column to Person table
-- Date: 2025-12-22
-- Description: Add support for GitHub profile URLs in Person table

ALTER TABLE Person ADD COLUMN githubUrl VARCHAR(500) AFTER portfolioUrl;

-- Optional: Add index if needed for searching
-- CREATE INDEX idx_githubUrl ON Person(githubUrl);
