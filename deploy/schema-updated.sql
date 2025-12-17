-- Updated DevLogs Database Schema
-- More robust structure with proper relationships and constraints

CREATE DATABASE IF NOT EXISTS devlogs;
USE devlogs;

-- Tags Table (predefined tag bank)
CREATE TABLE IF NOT EXISTS Tag (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#6c757d', -- hex color code for UI display
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Table with enhanced fields
CREATE TABLE IF NOT EXISTS User (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- Name fields
  firstName VARCHAR(100) NOT NULL,
  middleName VARCHAR(100),
  lastName VARCHAR(100) NOT NULL,
  
  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  passwordHint VARCHAR(255),
  
  -- Profile
  username VARCHAR(50) UNIQUE NOT NULL,
  profilePhoto TEXT,
  bio TEXT,
  
  -- Timestamps
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraint: email must end with @icstars.org
  CONSTRAINT chk_email CHECK (email LIKE '%@icstars.org')
);

-- DevLog Table with user relationship and image support
CREATE TABLE IF NOT EXISTS DevLog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- User relationship
  createdBy INT NOT NULL,
  
  -- Image support (can store multiple image URLs as JSON or comma-separated)
  images TEXT, -- JSON array of image URLs: ["url1", "url2"]
  
  -- Publishing
  isPublished BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key to User
  FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE CASCADE,
  
  -- Index for faster queries
  INDEX idx_created_by (createdBy),
  INDEX idx_created_at (createdAt),
  INDEX idx_published (isPublished)
);

-- DevLogTag Junction Table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS DevLogTag (
  id INT AUTO_INCREMENT PRIMARY KEY,
  devLogId INT NOT NULL,
  tagId INT NOT NULL,
  
  -- Foreign keys
  FOREIGN KEY (devLogId) REFERENCES DevLog(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES Tag(id) ON DELETE CASCADE,
  
  -- Prevent duplicate tag assignments
  UNIQUE KEY unique_devlog_tag (devLogId, tagId),
  
  -- Indexes for faster queries
  INDEX idx_devlog (devLogId),
  INDEX idx_tag (tagId)
);

-- Insert default tags
INSERT INTO Tag (name, color) VALUES
  ('JavaScript', '#f7df1e'),
  ('TypeScript', '#3178c6'),
  ('React', '#61dafb'),
  ('Node.js', '#339933'),
  ('Python', '#3776ab'),
  ('Database', '#4479a1'),
  ('API', '#ff6c37'),
  ('Bug Fix', '#dc3545'),
  ('Feature', '#28a745'),
  ('Debugging', '#ffc107'),
  ('Learning', '#17a2b8'),
  ('Performance', '#6f42c1'),
  ('Security', '#e83e8c'),
  ('Testing', '#fd7e14'),
  ('Deployment', '#20c997')
ON DUPLICATE KEY UPDATE name=name;
