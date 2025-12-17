-- Add role-based access control (RBAC) to User table
-- Migration Date: 2025-12-17

-- Add role column with enum type
ALTER TABLE User ADD COLUMN role ENUM('user', 'admin', 'super_admin') NOT NULL DEFAULT 'user';

-- Create index for faster role-based queries
CREATE INDEX idx_user_role ON User(role);

-- Set JValentineC as super_admin
UPDATE User SET role = 'super_admin' WHERE username = 'JValentineC';

-- Verify the changes
SELECT id, username, email, role FROM User;
