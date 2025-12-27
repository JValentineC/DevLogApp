-- Drop redundant tags column from DevLog
-- Use DevLogTag junction table instead for many-to-many relationship with Tag table
-- Migration Date: December 27, 2025

ALTER TABLE DevLog DROP COLUMN tags;
