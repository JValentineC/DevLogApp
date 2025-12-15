ALTER TABLE User ADD COLUMN username VARCHAR(255) UNIQUE;
ALTER TABLE User ADD COLUMN password VARCHAR(255);

-- Create a test admin user
INSERT INTO User (email, name, username, password) 
VALUES ('admin@devlogs.com', 'Admin', 'admin', 'admin123')
ON DUPLICATE KEY UPDATE username='admin', password='admin123';
