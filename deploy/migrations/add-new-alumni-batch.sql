-- Migration: Add new alumni to Person table
-- Date: 2025-12-23
-- These alumni can sign up and claim their accounts later

INSERT INTO Person (firstName, lastName, fullName, orgEmail, accountStatus, createdAt, updatedAt) VALUES
('Anthony', 'Simmons', 'Anthony Simmons', 'asimmons@icstars.org', 'unclaimed', NOW(), NOW()),
('Ashley', 'Smith', 'Ashley Smith', 'smitha@icstars.org', 'unclaimed', NOW(), NOW()),
('Delavonta', 'Butler', 'Delavonta Butler', 'mbutler@icstars.org', 'unclaimed', NOW(), NOW()),
('Diego', 'Gonzalez', 'Diego Gonzalez', 'digonzalez@icstars.org', 'unclaimed', NOW(), NOW()),
('Jaron', 'Wilson', 'Jaron Wilson', 'jwilson@icstars.org', 'unclaimed', NOW(), NOW()),
('Jasmine', 'Edmondson', 'Jasmine Edmondson', 'jedmondson@icstars.org', 'unclaimed', NOW(), NOW()),
('Jatore', 'Price', 'Jatore Price', 'jprice@icstars.org', 'unclaimed', NOW(), NOW()),
('Jocelyn', 'Lewis', 'Jocelyn Lewis', 'jlewis@icstars.org', 'unclaimed', NOW(), NOW()),
('Katlyn', 'Vargas', 'Katlyn Vargas', 'kvargas@icstars.org', 'unclaimed', NOW(), NOW()),
('Kevin', 'Diaz', 'Kevin Diaz', 'kdiaz@icstars.org', 'unclaimed', NOW(), NOW()),
('Maddy', 'Smith', 'Maddy Smith', 'msmith@icstars.org', 'unclaimed', NOW(), NOW()),
('Mariella', 'Monterrubio', 'Mariella Monterrubio', 'mmonterrubio@icstars.org', 'unclaimed', NOW(), NOW()),
('Prince Obeng', 'Amaning', 'Prince Obeng Amaning', 'pobeng-amaning@icstars.org', 'unclaimed', NOW(), NOW()),
('Wondemagegn', 'Meyer', 'Wondemagegn Meyer', 'wmeyer@icstars.org', 'unclaimed', NOW(), NOW());

-- Verify the insertion
SELECT id, firstName, lastName, orgEmail, accountStatus 
FROM Person 
WHERE orgEmail IN (
    'asimmons@icstars.org',
    'smitha@icstars.org',
    'mbutler@icstars.org',
    'digonzalez@icstars.org',
    'jwilson@icstars.org',
    'jedmondson@icstars.org',
    'jprice@icstars.org',
    'jlewis@icstars.org',
    'kvargas@icstars.org',
    'kdiaz@icstars.org',
    'msmith@icstars.org',
    'mmonterrubio@icstars.org',
    'pobeng-amaning@icstars.org',
    'wmeyer@icstars.org'
)
ORDER BY lastName, firstName;
