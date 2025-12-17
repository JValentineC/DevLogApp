import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs";
import { parse } from "csv-parse/sync";

dotenv.config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "devlogs.db",
  user: process.env.DB_USER || "jvc",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "devlogs",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Import users from CSV file
 * Expected columns: Owner, Cycle, First Name, Last Name, Full Name, Email 1, Email 2, Email 3, Captain, Early Years Attendee
 */
async function importUsers(csvFilePath) {
  try {
    console.log("Reading CSV file...");
    const fileContent = fs.readFileSync(csvFilePath, "utf-8");

    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${records.length} users in CSV file`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
      try {
        const firstName = record["First Name"]?.trim();
        const lastName = record["Last Name"]?.trim();
        const email =
          record["Email 1"]?.trim() ||
          record["Email 2"]?.trim() ||
          record["Email 3"]?.trim();

        // Skip if missing required fields
        if (!firstName || !lastName || !email) {
          console.log(`⚠️  Skipping row - missing required fields:`, {
            firstName,
            lastName,
            email,
          });
          skipped++;
          continue;
        }

        // Generate username from email (part before @) or from name
        let username = email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        // Check if username already exists
        const [existingUsers] = await pool.execute(
          "SELECT id FROM User WHERE username = ? OR email = ?",
          [username, email]
        );

        if (existingUsers.length > 0) {
          console.log(`⚠️  User already exists: ${username} (${email})`);
          skipped++;
          continue;
        }

        // Generate a temporary password (email prefix + "123")
        const tempPassword = username + "123";
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Insert user with default role 'user'
        await pool.execute(
          "INSERT INTO User (username, email, password, firstName, lastName, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'user', NOW(), NOW())",
          [username, email, hashedPassword, firstName, lastName]
        );

        console.log(
          `✅ Imported: ${firstName} ${lastName} (${username}) - Password: ${tempPassword}`
        );
        imported++;
      } catch (err) {
        console.error(`❌ Error importing user:`, err.message);
        errors++;
      }
    }

    console.log("\n=== Import Summary ===");
    console.log(`✅ Imported: ${imported}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total: ${records.length}`);
  } catch (error) {
    console.error("Fatal error:", error);
  } finally {
    await pool.end();
  }
}

// Get CSV file path from command line argument
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error("Usage: node import-users.js <path-to-csv-file>");
  console.error("Example: node import-users.js users.csv");
  process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
  console.error(`Error: File not found: ${csvFilePath}`);
  process.exit(1);
}

importUsers(csvFilePath);
