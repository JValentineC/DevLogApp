-- Migration: Add Privacy and Notification Settings to User table
-- Created: December 22, 2025
-- Purpose: Allow users to control profile visibility, bio visibility, and email notification preferences

-- Add profile visibility setting (public or private profile)
ALTER TABLE User ADD COLUMN profileVisibility ENUM('public', 'private') DEFAULT 'public' AFTER role;

-- Add bio visibility control (show/hide bio on public profile)
ALTER TABLE User ADD COLUMN showBioPublic BOOLEAN DEFAULT TRUE AFTER profileVisibility;

-- Add theme preference (light, dark, or system)
ALTER TABLE User ADD COLUMN theme VARCHAR(20) DEFAULT 'light' AFTER showBioPublic;

-- Add email notification preferences
ALTER TABLE User ADD COLUMN emailNotifications BOOLEAN DEFAULT TRUE AFTER theme;
ALTER TABLE User ADD COLUMN weeklyDigest BOOLEAN DEFAULT TRUE AFTER emailNotifications;
ALTER TABLE User ADD COLUMN marketingEmails BOOLEAN DEFAULT FALSE AFTER weeklyDigest;

-- Add index for faster queries on profileVisibility
CREATE INDEX idx_user_profile_visibility ON User(profileVisibility);

-- Verify the migration
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_DEFAULT, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'User' 
AND COLUMN_NAME IN ('profileVisibility', 'showBioPublic', 'theme', 'emailNotifications', 'weeklyDigest', 'marketingEmails')
ORDER BY ORDINAL_POSITION;
