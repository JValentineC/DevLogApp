-- Migration: Add Person, Cycle, and membership tracking tables
-- Run this in your MySQL shell after connecting with: mysql -h devlogs.db -u jvc -p
-- Then: USE devlogs; SOURCE /home/public/migration-add-person-cycle.sql;

-- Create Person table
CREATE TABLE `Person` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NULL,
  `firstName` VARCHAR(100) NOT NULL,
  `middleName` VARCHAR(100) NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `fullName` VARCHAR(255) NOT NULL,
  `orgEmail` VARCHAR(255) NULL,
  `personalEmail` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `linkedInUrl` VARCHAR(500) NULL,
  `portfolioUrl` VARCHAR(500) NULL,
  `isICaaMember` TINYINT NOT NULL DEFAULT 0,
  `icaaTier` VARCHAR(20) NULL,
  `accountStatus` VARCHAR(20) NOT NULL DEFAULT 'unclaimed',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  
  UNIQUE INDEX `Person_userId_key`(`userId`),
  UNIQUE INDEX `Person_orgEmail_key`(`orgEmail`),
  UNIQUE INDEX `Person_personalEmail_key`(`personalEmail`),
  INDEX `Person_lastName_idx`(`lastName`),
  INDEX `Person_accountStatus_idx`(`accountStatus`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Cycle table
CREATE TABLE `Cycle` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `city` VARCHAR(100) NULL,
  `startDate` DATE NULL,
  `endDate` DATE NULL,
  `notes` TEXT NULL,
  
  UNIQUE INDEX `Cycle_code_key`(`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create CycleMembership table
CREATE TABLE `CycleMembership` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `cycleId` INTEGER NOT NULL,
  `personId` INTEGER NOT NULL,
  `startDate` DATE NULL,
  `endDate` DATE NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  
  UNIQUE INDEX `CycleMembership_cycleId_personId_key`(`cycleId`, `personId`),
  INDEX `CycleMembership_cycleId_idx`(`cycleId`),
  INDEX `CycleMembership_personId_idx`(`personId`),
  INDEX `CycleMembership_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create CaptainAssignment table
CREATE TABLE `CaptainAssignment` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `cycleId` INTEGER NOT NULL,
  `personId` INTEGER NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'captain',
  `startDate` DATE NULL,
  `endDate` DATE NULL,
  `notes` TEXT NULL,
  
  UNIQUE INDEX `CaptainAssignment_cycleId_personId_role_startDate_key`(`cycleId`, `personId`, `role`, `startDate`),
  INDEX `CaptainAssignment_cycleId_idx`(`cycleId`),
  INDEX `CaptainAssignment_personId_idx`(`personId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create ICaaMembership table
CREATE TABLE `ICaaMembership` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `personId` INTEGER NOT NULL,
  `tier` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `startDate` DATE NOT NULL,
  `endDate` DATE NULL,
  `autoRenew` TINYINT NOT NULL DEFAULT 0,
  `lastPaymentAt` DATETIME(3) NULL,
  `notes` TEXT NULL,
  
  INDEX `ICaaMembership_personId_idx`(`personId`),
  INDEX `ICaaMembership_status_idx`(`status`),
  INDEX `ICaaMembership_startDate_endDate_idx`(`startDate`, `endDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create Resume table
CREATE TABLE `Resume` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `personId` INTEGER NOT NULL,
  `versionLabel` VARCHAR(100) NULL,
  `fileUrl` VARCHAR(1000) NULL,
  `fileMimeType` VARCHAR(100) NULL,
  `fileSizeBytes` BIGINT NULL,
  `fileHashSha256` CHAR(64) NULL,
  `fileBlob` LONGBLOB NULL,
  `isCurrent` TINYINT NOT NULL DEFAULT 0,
  `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` TEXT NULL,
  
  INDEX `Resume_personId_idx`(`personId`),
  INDEX `Resume_isCurrent_idx`(`isCurrent`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create JobSeekingProfile table
CREATE TABLE `JobSeekingProfile` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `personId` INTEGER NOT NULL,
  `desiredTitle` VARCHAR(255) NOT NULL,
  `roleFamily` VARCHAR(20) NOT NULL DEFAULT 'other',
  `skillsSummary` TEXT NULL,
  `skillsKeywords` JSON NULL,
  `preferredLocations` JSON NULL,
  `remotePreference` VARCHAR(20) NOT NULL DEFAULT 'no-preference',
  `availabilityDate` DATE NULL,
  `workAuthorization` VARCHAR(30) NOT NULL DEFAULT 'Prefer-not-to-say',
  `desiredSalaryMin` INTEGER NULL,
  `desiredSalaryMax` INTEGER NULL,
  `openToContract` TINYINT NOT NULL DEFAULT 1,
  `openToFullTime` TINYINT NOT NULL DEFAULT 1,
  `jobSearchStatus` VARCHAR(20) NOT NULL DEFAULT 'active',
  `updatedAt` DATETIME(3) NOT NULL,
  
  UNIQUE INDEX `JobSeekingProfile_personId_key`(`personId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraints
ALTER TABLE `Person` ADD CONSTRAINT `Person_userId_fkey` 
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `CycleMembership` ADD CONSTRAINT `CycleMembership_cycleId_fkey` 
  FOREIGN KEY (`cycleId`) REFERENCES `Cycle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CycleMembership` ADD CONSTRAINT `CycleMembership_personId_fkey` 
  FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CaptainAssignment` ADD CONSTRAINT `CaptainAssignment_cycleId_fkey` 
  FOREIGN KEY (`cycleId`) REFERENCES `Cycle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CaptainAssignment` ADD CONSTRAINT `CaptainAssignment_personId_fkey` 
  FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ICaaMembership` ADD CONSTRAINT `ICaaMembership_personId_fkey` 
  FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Resume` ADD CONSTRAINT `Resume_personId_fkey` 
  FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `JobSeekingProfile` ADD CONSTRAINT `JobSeekingProfile_personId_fkey` 
  FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Success message
SELECT 'Migration completed successfully!' AS status;
