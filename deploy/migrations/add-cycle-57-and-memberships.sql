-- Migration: Add Cycle 57 and link new alumni
-- Date: 2025-12-23

-- Add Cycle 57 if it doesn't exist
INSERT IGNORE INTO Cycle (code, city, startDate, notes, createdAt, updatedAt) 
VALUES ('CHI-57', 'Chicago', '2024-01-01', 'Chicago Cycle 57', NOW(), NOW());

-- Get the cycle ID for Cycle 57
SET @cycle57Id = (SELECT id FROM Cycle WHERE code = 'CHI-57' LIMIT 1);

-- Link all 14 new alumni to Cycle 57
INSERT INTO CycleMembership (cycleId, personId, status, createdAt, updatedAt)
SELECT @cycle57Id, id, 'alumni', NOW(), NOW()
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
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Verify the insertions
SELECT 
    c.code AS cycle,
    p.firstName,
    p.lastName,
    p.orgEmail,
    p.accountStatus,
    cm.status AS cycleStatus
FROM Person p
INNER JOIN CycleMembership cm ON p.id = cm.personId
INNER JOIN Cycle c ON cm.cycleId = c.id
WHERE p.orgEmail IN (
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
ORDER BY p.lastName, p.firstName;

-- Also show Cycle 57 details
SELECT * FROM Cycle WHERE code = 'CHI-57';
