-- Migration: Add password reset functionality to User table
-- Date: 2025-12-22
-- Description: Add columns for password reset token and expiry

ALTER TABLE User 
ADD COLUMN resetToken VARCHAR(255) NULL,
ADD COLUMN resetTokenExpiry DATETIME NULL;

-- Optional: Add index for faster token lookups
CREATE INDEX idx_resetToken ON User(resetToken);
