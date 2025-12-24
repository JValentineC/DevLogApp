import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import speakeasy from "speakeasy";
import jwt from "jsonwebtoken";
import multer from "multer";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";
import {
  authenticateToken,
  authorizeOwner,
  generateToken,
  requireRole,
} from "./middleware/auth.js";

// Load environment variables
dotenv.config();
// Load from protected folder (NFSN deployment)
try {
  dotenv.config({ path: "/home/protected/.env", override: true });
} catch (e) {
  console.error("Could not load /home/protected/.env:", e.message);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (we'll upload to Cloudinary from memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed!"), false);
      return;
    }
    cb(null, true);
  },
});

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for NFSN deployment
app.set("trust proxy", 1);

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

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for API
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: "Too many login attempts, please try again later.",
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: "Too many upload requests, please try again later.",
});

const settingsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 settings updates per 15 minutes
  message: "Too many settings updates, please try again later.",
});

// Middleware - CORS must come BEFORE rate limiter to handle preflight requests
app.use(
  cors({
    origin: [
      "https://jvalentinec.github.io",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Apply rate limiter AFTER CORS
app.use("/api/", limiter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "DevLogger API is running" });
});

// POST /api/auth/login - User login with bcrypt and JWT
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username/email and password are required",
      });
    }

    // Query user from database (case-sensitive username OR email)
    const [users] = await pool.execute(
      "SELECT id, username, password, email, name, profilePhoto, bio, role, twoFactorEnabled, twoFactorSecret, backupCodes FROM User WHERE BINARY username = ? OR LOWER(email) = LOWER(?)",
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid username/email or password",
      });
    }

    const user = users[0];

    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid username/email or password",
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate a temporary token for 2FA verification (expires in 5 minutes)
      const tempToken = jwt.sign(
        { userId: user.id, purpose: "2fa-verification" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );

      return res.json({
        success: true,
        requires2FA: true,
        tempToken,
        userId: user.id,
      });
    }

    // Update last login timestamp
    await pool.execute("UPDATE User SET lastLoginAt = NOW() WHERE id = ?", [
      user.id,
    ]);

    // Generate JWT token
    const token = generateToken(
      user.id,
      user.username,
      user.email,
      user.role || "user"
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        role: user.role || "user",
      },
      token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
      message: error.message,
    });
  }
});

// POST /api/auth/verify-2fa - Verify 2FA code
app.post("/api/auth/verify-2fa", authLimiter, async (req, res) => {
  try {
    const { userId, token, tempToken } = req.body;

    if (!userId || !token || !tempToken) {
      return res.status(400).json({
        success: false,
        error: "User ID, token, and tempToken are required",
      });
    }

    // Verify the temporary token
    try {
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      if (
        decoded.userId !== parseInt(userId) ||
        decoded.purpose !== "2fa-verification"
      ) {
        return res.status(401).json({
          success: false,
          error: "Invalid temporary token",
        });
      }
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: "Temporary token expired or invalid",
      });
    }

    // Get user's 2FA settings
    const [users] = await pool.execute(
      "SELECT id, username, email, name, profilePhoto, bio, role, twoFactorSecret, backupCodes FROM User WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = users[0];

    // Remove any spaces or dashes from the token
    const cleanToken = token.replace(/[\s-]/g, "");

    let isValid = false;

    // First, try to verify as TOTP code
    if (user.twoFactorSecret) {
      isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: cleanToken,
        window: 2, // Allow 2 time steps before/after current time
      });
    }

    // If TOTP failed, try backup codes
    if (!isValid && user.backupCodes) {
      try {
        const backupCodes = JSON.parse(user.backupCodes);
        if (Array.isArray(backupCodes)) {
          const codeIndex = backupCodes.findIndex(
            (code) => code === cleanToken
          );
          if (codeIndex !== -1) {
            // Valid backup code - remove it from the list
            backupCodes.splice(codeIndex, 1);
            await pool.execute("UPDATE User SET backupCodes = ? WHERE id = ?", [
              JSON.stringify(backupCodes),
              userId,
            ]);
            isValid = true;
          }
        }
      } catch (e) {
        console.error("Error parsing backup codes:", e);
      }
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid 2FA code",
      });
    }

    // Update last login timestamp
    await pool.execute("UPDATE User SET lastLoginAt = NOW() WHERE id = ?", [
      user.id,
    ]);

    // Generate full JWT token
    const authToken = generateToken(
      user.id,
      user.username,
      user.email,
      user.role || "user"
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        role: user.role || "user",
      },
      token: authToken,
    });
  } catch (error) {
    console.error("Error during 2FA verification:", error);
    res.status(500).json({
      success: false,
      error: "2FA verification failed",
      message: error.message,
    });
  }
});

// POST /api/auth/verify-alumni - Check if user is in pre-approved alumni list
app.post("/api/auth/verify-alumni", async (req, res) => {
  try {
    const { email, firstName, lastName, cycleCode } = req.body;

    if (!email && (!firstName || !lastName)) {
      return res.status(400).json({
        success: false,
        error: "Email or full name is required for verification",
      });
    }

    let matches = [];

    // Check 1: Email match in Person table (both claimed and unclaimed)
    if (email) {
      // First check Person table for unclaimed accounts
      const [personEmailMatches] = await pool.execute(
        `SELECT p.id, p.firstName, p.lastName, p.orgEmail, p.personalEmail, p.icaaTier, p.accountStatus, p.userId
         FROM Person p 
         WHERE LOWER(p.orgEmail) = LOWER(?) OR LOWER(p.personalEmail) = LOWER(?)`,
        [email, email]
      );

      // Then check User table for already claimed accounts
      const [userEmailMatches] = await pool.execute(
        `SELECT u.id, u.firstName, u.lastName, u.email, u.username, p.orgEmail, p.icaaTier, p.accountStatus 
         FROM User u 
         LEFT JOIN Person p ON u.id = p.userId 
         WHERE LOWER(u.email) = LOWER(?)`,
        [email]
      );

      matches.push(...personEmailMatches, ...userEmailMatches);
    }

    // Check 2: First name + Last name match (both claimed and unclaimed)
    if (firstName && lastName && matches.length === 0) {
      // First check Person table for unclaimed accounts
      const [personNameMatches] = await pool.execute(
        `SELECT p.id, p.firstName, p.lastName, p.orgEmail, p.personalEmail, p.icaaTier, p.accountStatus, p.userId
         FROM Person p 
         WHERE LOWER(p.firstName) = LOWER(?) AND LOWER(p.lastName) = LOWER(?)`,
        [firstName, lastName]
      );

      // Then check User table for already claimed accounts
      const [userNameMatches] = await pool.execute(
        `SELECT u.id, u.firstName, u.lastName, u.email, u.username, p.orgEmail, p.icaaTier, p.accountStatus 
         FROM User u 
         LEFT JOIN Person p ON u.id = p.userId 
         WHERE LOWER(u.firstName) = LOWER(?) AND LOWER(u.lastName) = LOWER(?)`,
        [firstName, lastName]
      );

      matches.push(...personNameMatches, ...userNameMatches);
    }

    // Check 3: First name + Cycle code match (if provided)
    if (firstName && cycleCode && matches.length === 0) {
      // Check Person table for cycle memberships
      const [personCycleMatches] = await pool.execute(
        `SELECT DISTINCT p.id, p.firstName, p.lastName, p.orgEmail, p.personalEmail, p.icaaTier, p.accountStatus, p.userId
         FROM Person p 
         LEFT JOIN CycleMembership cm ON p.id = cm.personId
         LEFT JOIN Cycle c ON cm.cycleId = c.id
         WHERE LOWER(p.firstName) = LOWER(?) AND LOWER(c.code) = LOWER(?)`,
        [firstName, cycleCode]
      );
      matches.push(...personCycleMatches);
    }

    // Remove duplicates based on person id or user id
    const uniqueMatches = matches.reduce((acc, current) => {
      // For Person records, use person id; for User records, use user id
      const idToCheck = current.userId || current.id;
      const exists = acc.find((item) => (item.userId || item.id) === idToCheck);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    if (uniqueMatches.length === 0) {
      return res.json({
        success: true,
        verified: false,
        matches: [],
        message:
          "No matching alumni record found. Only i.c.Stars/iCAA alumni can register.",
      });
    }

    // Check if any match already has an activated account
    const alreadyActivated = uniqueMatches.find(
      (match) =>
        match.accountStatus === "activated" ||
        match.accountStatus === "active" ||
        match.accountStatus === "signed_up" ||
        (match.userId !== null && match.userId !== undefined) // Person record linked to a User
    );

    if (alreadyActivated) {
      return res.json({
        success: true,
        verified: false,
        alreadyRegistered: true,
        matches: uniqueMatches,
        message: "This person already has an account. Please sign in instead.",
      });
    }

    res.json({
      success: true,
      verified: true,
      matches: uniqueMatches,
      matchCount: uniqueMatches.length,
      message:
        uniqueMatches.length === 1
          ? "Alumni verified! You can proceed with registration."
          : `Found ${uniqueMatches.length} potential matches. Please verify your information.`,
    });
  } catch (error) {
    console.error("Error verifying alumni:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify alumni status",
      message: error.message,
    });
  }
});

// GET /api/auth/check-email - Check if email exists in pre-approved alumni list
app.get("/api/auth/check-email/:email", async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Check if email exists in User or Person table (pre-registered alumni)
    const [users] = await pool.execute(
      "SELECT id, email, username FROM User WHERE LOWER(email) = LOWER(?)",
      [email]
    );

    const [persons] = await pool.execute(
      "SELECT id, orgEmail FROM Person WHERE LOWER(orgEmail) = LOWER(?)",
      [email]
    );

    const exists = users.length > 0 || persons.length > 0;
    const isRegistered = users.length > 0 && users[0].username !== null;

    res.json({
      success: true,
      exists, // Email is in the pre-approved alumni list
      isRegistered, // Email already has a completed account
      message: exists
        ? isRegistered
          ? "This email already has an account"
          : "Email verified - you can proceed with registration"
        : "This email is not in our alumni database",
    });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify email",
      message: error.message,
    });
  }
});

// POST /api/auth/forgot-password - Request password reset
app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Find user by email (check User table first, then Person table)
    let [users] = await pool.execute(
      "SELECT id, email, username FROM User WHERE LOWER(email) = LOWER(?)",
      [email]
    );

    // If not found in User table, check Person table (orgEmail and personalEmail)
    if (users.length === 0) {
      const [persons] = await pool.execute(
        `SELECT u.id, u.email, u.username 
         FROM Person p 
         JOIN User u ON p.userId = u.id 
         WHERE LOWER(p.orgEmail) = LOWER(?) OR LOWER(p.personalEmail) = LOWER(?)`,
        [email, email]
      );
      users = persons;
    }

    // Always return success even if email doesn't exist (security best practice)
    if (users.length === 0) {
      return res.json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
      });
    }

    const user = users[0];

    // Generate reset token (secure random string)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await pool.execute(
      "UPDATE User SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?",
      [resetToken, resetTokenExpiry, user.id]
    );

    // Create reset URL
    const resetUrl = `${
      process.env.FRONTEND_URL || "https://jvalentinec.github.io/DevLogApp"
    }/reset-password?token=${resetToken}`;

    // Send email with reset link
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"DevLogs" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "DevLogs Password Reset Request",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>You requested a password reset for your DevLogs account.</p>
                <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>:</p>
                <center>
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </center>
                <p>Or copy and paste this link into your browser:</p>
                <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all;">
                  <a href="${resetUrl}">${resetUrl}</a>
                </p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p><strong>Didn't request this?</strong></p>
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>
              <div class="footer">
                <p>This is an automated message from DevLogs. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      // Log the URL as fallback
      console.log(`Password reset link for ${user.email}: ${resetUrl}`);
    }

    res.json({
      success: true,
      message: "If the email exists, a password reset link has been sent",
      // Only include token in development for testing
      ...(process.env.NODE_ENV === "development" && { resetToken, resetUrl }),
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process password reset request",
    });
  }
});

// POST /api/auth/reset-password - Reset password with token
app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Token and new password are required",
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    }

    // Find user with valid reset token
    const [users] = await pool.execute(
      "SELECT id, email, username FROM User WHERE resetToken = ? AND resetTokenExpiry > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await pool.execute(
      "UPDATE User SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.json({
      success: true,
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Error in reset-password:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
});

// POST /api/auth/register - User registration
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      middleName,
      lastName,
      passwordHint,
      bio,
      phone,
      linkedInUrl,
      portfolioUrl,
      cycleCode,
      isICaaMember,
      enable2FA,
    } = req.body;

    // Validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
        details: {
          username: !username ? "Username is required" : null,
          email: !email ? "Email is required" : null,
          password: !password ? "Password is required" : null,
          firstName: !firstName ? "First name is required" : null,
          lastName: !lastName ? "Last name is required" : null,
        },
      });
    }

    // Validate username has no spaces
    if (username.includes(" ")) {
      return res.status(400).json({
        success: false,
        error: "Username cannot contain spaces",
      });
    }

    // Validate username length
    if (username.length < 4) {
      return res.status(400).json({
        success: false,
        error: "Username must be at least 4 characters long",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
      });
    }

    // Validate email format and @icstars.org domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !emailRegex.test(email) ||
      !email.toLowerCase().endsWith("@icstars.org")
    ) {
      return res.status(400).json({
        success: false,
        error: "Must use an @icstars.org email address",
      });
    }

    // Check if this email/name combo exists in pre-loaded alumni
    const [existingUsers] = await pool.execute(
      `SELECT u.id, u.username, p.id as personId, p.accountStatus 
       FROM User u 
       LEFT JOIN Person p ON u.id = p.userId 
       WHERE (LOWER(u.email) = LOWER(?) OR LOWER(p.orgEmail) = LOWER(?)) 
       AND LOWER(u.firstName) = LOWER(?) 
       AND LOWER(u.lastName) = LOWER(?)`,
      [email, email, firstName, lastName]
    );

    // Also check for Person records without a linked User (pre-loaded data)
    const [orphanedPersons] = await pool.execute(
      `SELECT id as personId, accountStatus 
       FROM Person 
       WHERE LOWER(orgEmail) = LOWER(?) 
       AND LOWER(firstName) = LOWER(?) 
       AND LOWER(lastName) = LOWER(?)
       AND userId IS NULL`,
      [email, firstName, lastName]
    );

    if (existingUsers.length === 0 && orphanedPersons.length === 0) {
      return res.status(403).json({
        success: false,
        error:
          "You are not in our alumni database. Only verified i.c.Stars/iCAA alumni can register.",
      });
    }

    const existingUser = existingUsers[0];
    const orphanedPerson = orphanedPersons[0];

    // Check if account is already activated
    if (
      existingUser?.accountStatus === "activated" ||
      existingUser?.accountStatus === "active" ||
      orphanedPerson?.accountStatus === "activated" ||
      orphanedPerson?.accountStatus === "active"
    ) {
      return res.status(409).json({
        success: false,
        error:
          "This account has already been activated. Please sign in instead.",
      });
    }

    // Check if username is already taken by someone else (case-sensitive)
    const [usernameCheck] = await pool.execute(
      "SELECT id FROM User WHERE BINARY username = ?",
      [username]
    );

    // If username exists and it's not the same person trying to register
    if (usernameCheck.length > 0) {
      const existingUsernameId = usernameCheck[0].id;
      // Only block if it's a different user (not updating their own username)
      if (existingUser && existingUsernameId !== existingUser.id) {
        return res.status(409).json({
          success: false,
          error: "Username is already taken. Please choose another.",
        });
      } else if (!existingUser) {
        // New user trying to use taken username
        return res.status(409).json({
          success: false,
          error: "Username is already taken. Please choose another.",
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let userId;

    // If there's an existing User, update it; otherwise, create a new one
    if (existingUser) {
      // Update the existing User record with account details
      await pool.execute(
        `UPDATE User 
         SET username = ?, 
             password = ?, 
             email = ?,
             middleName = ?,
             passwordHint = ?,
             bio = ?,
             updatedAt = NOW() 
         WHERE id = ?`,
        [
          username,
          hashedPassword,
          email,
          middleName,
          passwordHint,
          bio,
          existingUser.id,
        ]
      );
      userId = existingUser.id;
    } else if (orphanedPerson) {
      // Create a new User record for the orphaned Person
      const [result] = await pool.execute(
        `INSERT INTO User (username, password, email, firstName, middleName, lastName, passwordHint, bio, role, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user', NOW(), NOW())`,
        [
          username,
          hashedPassword,
          email,
          firstName,
          middleName,
          lastName,
          passwordHint,
          bio,
        ]
      );
      userId = result.insertId;
    }

    // Update or create Person record
    const fullName = `${firstName}${
      middleName ? " " + middleName : ""
    } ${lastName}`;

    if (existingUser?.personId || orphanedPerson?.personId) {
      // Update existing Person record
      const personIdToUpdate =
        existingUser?.personId || orphanedPerson.personId;
      await pool.execute(
        `UPDATE Person 
         SET userId = ?,
             firstName = ?,
             lastName = ?,
             fullName = ?,
             orgEmail = ?,
             phone = ?,
             linkedInUrl = ?,
             portfolioUrl = ?,
             isICaaMember = ?,
             accountStatus = 'activated',
             icaaTier = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [
          userId,
          firstName,
          lastName,
          fullName,
          email,
          phone,
          linkedInUrl,
          portfolioUrl,
          isICaaMember ? 1 : 0,
          cycleCode,
          personIdToUpdate,
        ]
      );
    } else {
      // Create new Person record (shouldn't happen with pre-loaded data)
      await pool.execute(
        `INSERT INTO Person (userId, firstName, lastName, fullName, orgEmail, phone, linkedInUrl, portfolioUrl, isICaaMember, accountStatus, icaaTier, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activated', ?, NOW(), NOW())`,
        [
          userId,
          firstName,
          lastName,
          fullName,
          email,
          phone,
          linkedInUrl,
          portfolioUrl,
          isICaaMember ? 1 : 0,
          cycleCode,
        ]
      );
    }

    // Generate JWT token
    const token = generateToken(userId, username, email, "user");

    // Handle 2FA setup if requested
    let twoFactorData = {};
    if (enable2FA) {
      const secret = speakeasy.generateSecret({
        name: `DevLogs (${username})`,
        length: 32,
      });

      // Generate backup codes
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        backupCodes.push(
          Math.random().toString(36).substring(2, 10).toUpperCase()
        );
      }

      // Update user with 2FA data
      await pool.execute(
        `UPDATE User 
         SET twoFactorEnabled = 1,
             twoFactorSecret = ?,
             backupCodes = ?,
             twoFactorEnabledAt = NOW()
         WHERE id = ?`,
        [secret.base32, JSON.stringify(backupCodes), userId]
      );

      const QRCode = await import("qrcode");
      const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

      twoFactorData = {
        twoFactorSecret: secret.base32,
        qrCode: qrCodeDataUrl,
        backupCodes,
      };
    }

    res.status(201).json({
      success: true,
      message: "Account activated successfully",
      user: {
        id: userId,
        username,
        email,
        name: `${firstName}${middleName ? " " + middleName : ""} ${lastName}`,
      },
      token,
      ...twoFactorData,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed",
      message: error.message,
    });
  }
});

// POST /api/auth/setup-2fa - Setup 2FA for existing user
app.post("/api/auth/setup-2fa", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Generate 2FA secret
    const secret = speakeasy.generateSecret({
      name: `DevLogs (${req.user.email})`,
      length: 20,
    });

    // Generate QR code as data URL
    const QRCode = await import("qrcode");
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store the secret temporarily (user needs to verify before enabling)
    // For now, just return it - the verify endpoint will save it
    res.json({
      success: true,
      qrCode: qrCodeDataUrl,
      secret: secret.base32,
    });
  } catch (error) {
    console.error("Error setting up 2FA:", error);
    res.status(500).json({
      success: false,
      error: "Failed to setup 2FA",
      message: error.message,
    });
  }
});

// GET /api/users - Get all users with published dev logs
app.get("/api/users", async (req, res) => {
  try {
    // Get all users (for now, until we add userId to DevLog table)
    const [users] = await pool.execute(`
      SELECT 
        u.id, 
        u.username, 
        u.name, 
        u.profilePhoto, 
        u.bio,
        2 as devLogCount
      FROM User u
      WHERE u.username IS NOT NULL
      ORDER BY u.username ASC
    `);

    res.json({
      success: true,
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
      message: error.message,
    });
  }
});

// GET /api/users/:id - Get individual user with social links (Protected)
app.get(
  "/api/users/:id",
  authenticateToken,
  authorizeOwner,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const [users] = await pool.execute(
        `SELECT 
          u.id, u.username, u.email, u.name, u.profilePhoto, u.bio, u.role,
          p.linkedInUrl, p.portfolioUrl, p.githubUrl
        FROM User u
        LEFT JOIN Person p ON u.id = p.userId
        WHERE u.id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        user: users[0],
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user",
        message: error.message,
      });
    }
  }
);

// PUT /api/users/:id - Update user profile (Protected)
app.put(
  "/api/users/:id",
  authenticateToken,
  authorizeOwner,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const {
        username,
        name,
        bio,
        profilePhoto,
        linkedInUrl,
        portfolioUrl,
        githubUrl,
        currentPassword,
        newPassword,
      } = req.body;

      // If changing password, verify current password first
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            error: "Current password required to change password",
          });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({
            success: false,
            error: "New password must be at least 6 characters",
          });
        }

        const [users] = await pool.execute(
          "SELECT password FROM User WHERE id = ?",
          [userId]
        );

        if (users.length === 0) {
          return res.status(404).json({
            success: false,
            error: "User not found",
          });
        }

        // Verify current password with bcrypt
        const isPasswordValid = await bcrypt.compare(
          currentPassword,
          users[0].password
        );

        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            error: "Current password is incorrect",
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update with new password
        await pool.execute(
          "UPDATE User SET username = ?, name = ?, bio = ?, profilePhoto = ?, password = ? WHERE id = ?",
          [username, name, bio, profilePhoto, hashedPassword, userId]
        );
      } else {
        // Update without password change
        await pool.execute(
          "UPDATE User SET username = ?, name = ?, bio = ?, profilePhoto = ? WHERE id = ?",
          [username, name, bio, profilePhoto, userId]
        );
      }

      // Handle social links (Person table update/insert)
      if (
        linkedInUrl !== undefined ||
        portfolioUrl !== undefined ||
        githubUrl !== undefined
      ) {
        // First, check if a Person record exists for this user
        const [existingPersons] = await pool.execute(
          "SELECT id FROM Person WHERE userId = ?",
          [userId]
        );

        if (existingPersons.length > 0) {
          // Update existing Person record
          const personId = existingPersons[0].id;
          await pool.execute(
            "UPDATE Person SET linkedInUrl = ?, portfolioUrl = ?, githubUrl = ? WHERE id = ?",
            [
              linkedInUrl || null,
              portfolioUrl || null,
              githubUrl || null,
              personId,
            ]
          );
        } else {
          // Create new Person record linked to this user
          // Get user info to populate required Person fields
          const [userInfo] = await pool.execute(
            "SELECT username, name FROM User WHERE id = ?",
            [userId]
          );

          if (userInfo.length > 0) {
            const user = userInfo[0];
            const nameParts = (user.name || user.username || "").split(" ");
            const firstName = nameParts[0] || "First";
            const lastName =
              nameParts.length > 1 ? nameParts[nameParts.length - 1] : "Last";
            const fullName = user.name || user.username || "User";

            await pool.execute(
              "INSERT INTO Person (userId, firstName, lastName, fullName, linkedInUrl, portfolioUrl, githubUrl) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [
                userId,
                firstName,
                lastName,
                fullName,
                linkedInUrl || null,
                portfolioUrl || null,
                githubUrl || null,
              ]
            );
          }
        }
      }

      // Fetch updated user data with Person social links
      const [updatedUsers] = await pool.execute(
        `SELECT 
          u.id, u.username, u.email, u.name, u.profilePhoto, u.bio,
          p.linkedInUrl, p.portfolioUrl, p.githubUrl
        FROM User u
        LEFT JOIN Person p ON u.id = p.userId
        WHERE u.id = ?`,
        [userId]
      );

      if (updatedUsers.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        user: updatedUsers[0],
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update profile",
        message: error.message,
      });
    }
  }
);

// POST /api/users/:id/profile-photo - Upload profile photo to Cloudinary (Protected)
app.post(
  "/api/users/:id/profile-photo",
  authenticateToken,
  authorizeOwner,
  uploadLimiter,
  upload.single("photo"),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Validate file exists
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No photo file provided",
        });
      }

      // Server-side file type validation (check MIME type)
      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
        });
      }

      // Server-side file size validation (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: "File too large. Maximum size is 10MB.",
        });
      }

      // Additional validation: Check magic numbers (file signature)
      // This prevents users from renaming non-image files to bypass MIME type check
      const fileSignatures = {
        ffd8ff: "image/jpeg",
        "89504e47": "image/png",
        47494638: "image/gif",
        52494646: "image/webp", // RIFF header for WebP
      };

      const fileHeader = req.file.buffer.toString("hex", 0, 4);
      const isValidImage = Object.keys(fileSignatures).some((sig) =>
        fileHeader.startsWith(sig)
      );

      if (!isValidImage) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid image file. File content does not match image format.",
        });
      }

      // Upload to Cloudinary with smart cropping for consistent circular avatars
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "devlogs/profiles",
            public_id: `user_${userId}_${Date.now()}`,
            transformation: [
              // Smart crop to square, focusing on face if detected
              { width: 500, height: 500, crop: "fill", gravity: "face" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
            // Additional Cloudinary security options
            resource_type: "image",
            allowed_formats: ["jpg", "png", "gif", "webp"],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(req.file.buffer);
      });

      // Update user's profilePhoto with Cloudinary URL
      await pool.execute("UPDATE User SET profilePhoto = ? WHERE id = ?", [
        uploadResult.secure_url,
        userId,
      ]);

      res.json({
        success: true,
        photoUrl: uploadResult.secure_url,
        message: "Profile photo uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading profile photo:", error);

      // Don't expose internal error details to client
      const errorMessage =
        error.message?.includes("file") || error.message?.includes("upload")
          ? error.message
          : "Failed to upload profile photo";

      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }
);

// GET /api/users/:id/settings - Get user privacy and notification settings (Protected)
app.get(
  "/api/users/:id/settings",
  authenticateToken,
  authorizeOwner,
  settingsLimiter,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const [users] = await pool.execute(
        `SELECT 
          profileVisibility, 
          showBioPublic, 
          theme, 
          emailNotifications, 
          weeklyDigest, 
          marketingEmails
        FROM User 
        WHERE id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        settings: users[0],
      });
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch settings",
        message: error.message,
      });
    }
  }
);

// PUT /api/users/:id/settings - Update user privacy and notification settings (Protected)
app.put(
  "/api/users/:id/settings",
  authenticateToken,
  authorizeOwner,
  settingsLimiter,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const {
        profileVisibility,
        showBioPublic,
        theme,
        emailNotifications,
        weeklyDigest,
        marketingEmails,
      } = req.body;

      // Validate profileVisibility enum
      if (
        profileVisibility &&
        !["public", "private"].includes(profileVisibility)
      ) {
        return res.status(400).json({
          success: false,
          error: "profileVisibility must be 'public' or 'private'",
        });
      }

      // Validate theme
      if (theme && !["light", "dark", "system"].includes(theme)) {
        return res.status(400).json({
          success: false,
          error: "theme must be 'light', 'dark', or 'system'",
        });
      }

      // Validate boolean fields
      const booleanFields = {
        showBioPublic,
        emailNotifications,
        weeklyDigest,
        marketingEmails,
      };

      for (const [key, value] of Object.entries(booleanFields)) {
        if (value !== undefined && typeof value !== "boolean") {
          return res.status(400).json({
            success: false,
            error: `${key} must be a boolean value`,
          });
        }
      }

      // Build dynamic update query based on provided fields
      const updates = [];
      const values = [];

      if (profileVisibility !== undefined) {
        updates.push("profileVisibility = ?");
        values.push(profileVisibility);
      }
      if (showBioPublic !== undefined) {
        updates.push("showBioPublic = ?");
        values.push(showBioPublic);
      }
      if (theme !== undefined) {
        updates.push("theme = ?");
        values.push(theme);
      }
      if (emailNotifications !== undefined) {
        updates.push("emailNotifications = ?");
        values.push(emailNotifications);
      }
      if (weeklyDigest !== undefined) {
        updates.push("weeklyDigest = ?");
        values.push(weeklyDigest);
      }
      if (marketingEmails !== undefined) {
        updates.push("marketingEmails = ?");
        values.push(marketingEmails);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No settings provided to update",
        });
      }

      // Add userId to values array for WHERE clause
      values.push(userId);

      // Execute update
      await pool.execute(
        `UPDATE User SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      // Fetch updated settings
      const [updatedUsers] = await pool.execute(
        `SELECT 
          profileVisibility, 
          showBioPublic, 
          theme, 
          emailNotifications, 
          weeklyDigest, 
          marketingEmails
        FROM User 
        WHERE id = ?`,
        [userId]
      );

      res.json({
        success: true,
        settings: updatedUsers[0],
        message: "Settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update settings",
        message: error.message,
      });
    }
  }
);

// GET /api/devlogs - Get all dev log entries
app.get("/api/devlogs", async (req, res) => {
  try {
    const { published, limit, offset } = req.query;

    let query = `
      SELECT 
        DevLog.*,
        User.id as authorId,
        User.username as authorUsername,
        User.firstName as authorFirstName,
        User.lastName as authorLastName,
        User.profilePhoto as authorProfilePhoto
      FROM DevLog
      LEFT JOIN User ON DevLog.createdBy = User.id
    `;
    const params = [];

    if (published !== undefined) {
      query += " WHERE DevLog.isPublished = ?";
      params.push(published === "true" ? 1 : 0);
    }

    query += " ORDER BY DevLog.createdAt DESC";

    if (limit) {
      query += " LIMIT ?";
      params.push(parseInt(limit));
    }

    if (offset) {
      query += " OFFSET ?";
      params.push(parseInt(offset));
    }

    const [entries] = await pool.execute(query, params);
    const [countResult] = await pool.execute(
      published !== undefined
        ? "SELECT COUNT(*) as count FROM DevLog WHERE isPublished = ?"
        : "SELECT COUNT(*) as count FROM DevLog",
      published !== undefined ? [published === "true" ? 1 : 0] : []
    );

    // Convert MySQL boolean integers to actual booleans and format author info
    const formattedEntries = entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
      isPublished: Boolean(entry.isPublished),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      createdBy: entry.createdBy,
      images: entry.images,
      author: entry.authorId
        ? {
            id: entry.authorId,
            username: entry.authorUsername,
            firstName: entry.authorFirstName,
            lastName: entry.authorLastName,
            profilePhoto: entry.authorProfilePhoto,
          }
        : null,
    }));

    res.json({
      success: true,
      entries: formattedEntries,
      count: countResult[0].count,
    });
  } catch (error) {
    console.error("Error fetching dev logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dev logs",
      message: error.message,
    });
  }
});

// GET /api/devlogs/:id - Get a single dev log entry
app.get("/api/devlogs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [entries] = await pool.execute(
      `
      SELECT 
        DevLog.*,
        User.id as authorId,
        User.username as authorUsername,
        User.firstName as authorFirstName,
        User.lastName as authorLastName,
        User.profilePhoto as authorProfilePhoto
      FROM DevLog
      LEFT JOIN User ON DevLog.createdBy = User.id
      WHERE DevLog.id = ?
    `,
      [id]
    );

    if (entries.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Dev log entry not found",
      });
    }

    const entry = entries[0];
    const formattedEntry = {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
      isPublished: Boolean(entry.isPublished),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      createdBy: entry.createdBy,
      images: entry.images,
      author: entry.authorId
        ? {
            id: entry.authorId,
            username: entry.authorUsername,
            firstName: entry.authorFirstName,
            lastName: entry.authorLastName,
            profilePhoto: entry.authorProfilePhoto,
          }
        : null,
    };

    res.json({
      success: true,
      data: formattedEntry,
    });
  } catch (error) {
    console.error("Error fetching dev log:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dev log",
      message: error.message,
    });
  }
});

// POST /api/devlogs - Create a new dev log entry (Protected)
app.post("/api/devlogs", authenticateToken, async (req, res) => {
  try {
    const { title, content, tags, isPublished } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: {
          title: !title ? "Title is required" : null,
          content: !content ? "Content is required" : null,
        },
      });
    }

    const [result] = await pool.execute(
      "INSERT INTO DevLog (title, content, tags, isPublished, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
      [title, content, tags || null, isPublished || false, userId]
    );

    const [newEntry] = await pool.execute(
      `
      SELECT 
        DevLog.*,
        User.id as authorId,
        User.username as authorUsername,
        User.firstName as authorFirstName,
        User.lastName as authorLastName,
        User.profilePhoto as authorProfilePhoto
      FROM DevLog
      LEFT JOIN User ON DevLog.createdBy = User.id
      WHERE DevLog.id = ?
    `,
      [result.insertId]
    );

    const entry = newEntry[0];
    const formattedEntry = {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
      isPublished: Boolean(entry.isPublished),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      createdBy: entry.createdBy,
      images: entry.images,
      author: entry.authorId
        ? {
            id: entry.authorId,
            username: entry.authorUsername,
            firstName: entry.authorFirstName,
            lastName: entry.authorLastName,
            profilePhoto: entry.authorProfilePhoto,
          }
        : null,
    };

    res.status(201).json({
      success: true,
      message: "Dev log entry created successfully",
      data: formattedEntry,
    });
  } catch (error) {
    console.error("Error creating dev log:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create dev log entry",
      message: error.message,
    });
  }
});

// PUT /api/devlogs/:id - Update a dev log entry (Protected)
app.put("/api/devlogs/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, isPublished } = req.body;
    const userId = req.user.userId;

    const [existing] = await pool.execute("SELECT * FROM DevLog WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Dev log entry not found",
      });
    }

    // Check if user owns this dev log
    if (existing[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: "You can only edit your own dev logs",
      });
    }

    await pool.execute(
      "UPDATE DevLog SET title = ?, content = ?, tags = ?, isPublished = ?, updatedAt = NOW() WHERE id = ?",
      [
        title !== undefined ? title : existing[0].title,
        content !== undefined ? content : existing[0].content,
        tags !== undefined ? tags : existing[0].tags,
        isPublished !== undefined ? isPublished : existing[0].isPublished,
        id,
      ]
    );

    const [updated] = await pool.execute(
      `
      SELECT 
        DevLog.*,
        User.id as authorId,
        User.username as authorUsername,
        User.firstName as authorFirstName,
        User.lastName as authorLastName,
        User.profilePhoto as authorProfilePhoto
      FROM DevLog
      LEFT JOIN User ON DevLog.createdBy = User.id
      WHERE DevLog.id = ?
    `,
      [id]
    );

    const entry = updated[0];
    const formattedEntry = {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
      isPublished: Boolean(entry.isPublished),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      createdBy: entry.createdBy,
      images: entry.images,
      author: entry.authorId
        ? {
            id: entry.authorId,
            username: entry.authorUsername,
            firstName: entry.authorFirstName,
            lastName: entry.authorLastName,
            profilePhoto: entry.authorProfilePhoto,
          }
        : null,
    };

    res.json({
      success: true,
      message: "Dev log entry updated successfully",
      data: formattedEntry,
    });
  } catch (error) {
    console.error("Error updating dev log:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update dev log entry",
      message: error.message,
    });
  }
});

// DELETE /api/devlogs/:id - Delete a dev log entry (Protected)
app.delete("/api/devlogs/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [existing] = await pool.execute("SELECT * FROM DevLog WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Dev log entry not found",
      });
    }

    // Check if user owns this dev log
    if (existing[0].createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own dev logs",
      });
    }

    await pool.execute("DELETE FROM DevLog WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Dev log entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dev log:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete dev log entry",
      message: error.message,
    });
  }
});

// ==================== ADMIN USER MANAGEMENT ENDPOINTS ====================

// GET /api/admin/users - List all users (super_admin only)
app.get(
  "/api/admin/users",
  authenticateToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const { cycleId } = req.query;

      let query = `
        SELECT 
          u.id, 
          u.username, 
          u.email, 
          u.firstName, 
          u.lastName, 
          u.role, 
          u.createdAt, 
          u.updatedAt,
          GROUP_CONCAT(DISTINCT c.code ORDER BY c.code SEPARATOR ', ') as cycles,
          GROUP_CONCAT(DISTINCT c.id ORDER BY c.id) as cycleIds
        FROM User u
        LEFT JOIN Person p ON u.id = p.userId
        LEFT JOIN CycleMembership cm ON p.id = cm.personId
        LEFT JOIN Cycle c ON cm.cycleId = c.id
      `;

      const params = [];

      if (cycleId) {
        query += ` WHERE c.id = ?`;
        params.push(cycleId);
      }

      query += ` GROUP BY u.id ORDER BY u.createdAt DESC`;

      const [users] = await pool.execute(query, params);

      res.json({
        success: true,
        users: users,
        count: users.length,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch users",
        message: error.message,
      });
    }
  }
);

// POST /api/admin/users - Create new user (super_admin only)
app.post(
  "/api/admin/users",
  authenticateToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        role = "user",
      } = req.body;

      // Validation
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: "All fields are required",
        });
      }

      // Validate role
      const validRoles = ["user", "admin", "super_admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Invalid role. Must be user, admin, or super_admin",
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email format",
        });
      }

      // Check if username or email already exists
      const [existingUsers] = await pool.execute(
        "SELECT id FROM User WHERE username = ? OR email = ?",
        [username, email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          success: false,
          error: "Username or email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [result] = await pool.execute(
        "INSERT INTO User (username, email, password, firstName, lastName, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
        [username, email, hashedPassword, firstName, lastName, role]
      );

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          id: result.insertId,
          username,
          email,
          firstName,
          lastName,
          role,
        },
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create user",
        message: error.message,
      });
    }
  }
);

// PATCH /api/admin/users/:id/role - Update user role (super_admin only)
app.patch(
  "/api/admin/users/:id/role",
  authenticateToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      // Validation
      const validRoles = ["user", "admin", "super_admin"];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Invalid role. Must be user, admin, or super_admin",
        });
      }

      // Check if user exists
      const [users] = await pool.execute(
        "SELECT id, username FROM User WHERE id = ?",
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Prevent changing own role
      if (userId === req.user.userId) {
        return res.status(403).json({
          success: false,
          error: "You cannot change your own role",
        });
      }

      // Update role
      await pool.execute(
        "UPDATE User SET role = ?, updatedAt = NOW() WHERE id = ?",
        [role, userId]
      );

      res.json({
        success: true,
        message: "User role updated successfully",
        data: {
          id: userId,
          username: users[0].username,
          role,
        },
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user role",
        message: error.message,
      });
    }
  }
);

// DELETE /api/admin/users/:id - Delete user (super_admin only)
app.delete(
  "/api/admin/users/:id",
  authenticateToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Check if user exists
      const [users] = await pool.execute(
        "SELECT id, username FROM User WHERE id = ?",
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Prevent deleting own account
      if (userId === req.user.userId) {
        return res.status(403).json({
          success: false,
          error: "You cannot delete your own account",
        });
      }

      // Delete user (cascade will delete their dev logs)
      await pool.execute("DELETE FROM User WHERE id = ?", [userId]);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete user",
        message: error.message,
      });
    }
  }
);

// ==================== ALUMNI/PERSON ENGAGEMENT ENDPOINTS ====================

// GET /api/people - Get all alumni/person records with filters (admin+ only)
app.get(
  "/api/people",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        cycleId,
        isCaptain,
        search,
        status,
        limit = 100,
        offset = 0,
      } = req.query;

      let query = `
        SELECT 
          p.id,
          p.firstName,
          p.middleName,
          p.lastName,
          p.fullName,
          p.orgEmail,
          p.personalEmail,
          p.phone,
          p.linkedInUrl,
          p.portfolioUrl,
          p.isICaaMember,
          p.icaaTier,
          p.accountStatus,
          p.createdAt,
          p.updatedAt,
          GROUP_CONCAT(DISTINCT c.code ORDER BY c.code SEPARATOR ', ') as cycles,
          GROUP_CONCAT(DISTINCT c.id ORDER BY c.id) as cycleIds,
          MAX(CASE WHEN ca.id IS NOT NULL THEN 1 ELSE 0 END) as isCaptain
        FROM Person p
        LEFT JOIN CycleMembership cm ON p.id = cm.personId
        LEFT JOIN Cycle c ON cm.cycleId = c.id
        LEFT JOIN CaptainAssignment ca ON p.id = ca.personId
        WHERE 1=1
      `;

      const params = [];

      // Filter by cycle
      if (cycleId) {
        query += ` AND cm.cycleId = ?`;
        params.push(cycleId);
      }

      // Filter by captain status
      if (isCaptain !== undefined) {
        if (isCaptain === "true" || isCaptain === "1") {
          query += ` AND ca.id IS NOT NULL`;
        } else if (isCaptain === "false" || isCaptain === "0") {
          query += ` AND ca.id IS NULL`;
        }
      }

      // Filter by account status
      if (status) {
        query += ` AND p.accountStatus = ?`;
        params.push(status);
      }

      // Search by name or email
      if (search) {
        query += ` AND (
          p.firstName LIKE ? OR 
          p.lastName LIKE ? OR 
          p.fullName LIKE ? OR 
          p.orgEmail LIKE ? OR 
          p.personalEmail LIKE ?
        )`;
        const searchPattern = `%${search}%`;
        params.push(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern
        );
      }

      query += ` GROUP BY p.id ORDER BY p.lastName, p.firstName`;
      query += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [people] = await pool.execute(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM Person p
        LEFT JOIN CycleMembership cm ON p.id = cm.personId
        LEFT JOIN CaptainAssignment ca ON p.id = ca.personId
        WHERE 1=1
      `;

      const countParams = [];
      if (cycleId) {
        countQuery += ` AND cm.cycleId = ?`;
        countParams.push(cycleId);
      }
      if (isCaptain !== undefined) {
        if (isCaptain === "true" || isCaptain === "1") {
          countQuery += ` AND ca.id IS NOT NULL`;
        } else if (isCaptain === "false" || isCaptain === "0") {
          countQuery += ` AND ca.id IS NULL`;
        }
      }
      if (status) {
        countQuery += ` AND p.accountStatus = ?`;
        countParams.push(status);
      }
      if (search) {
        countQuery += ` AND (
          p.firstName LIKE ? OR 
          p.lastName LIKE ? OR 
          p.fullName LIKE ? OR 
          p.orgEmail LIKE ? OR 
          p.personalEmail LIKE ?
        )`;
        const searchPattern = `%${search}%`;
        countParams.push(
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern,
          searchPattern
        );
      }

      const [countResult] = await pool.execute(countQuery, countParams);

      res.json({
        success: true,
        people: people.map((p) => ({
          ...p,
          isCaptain: Boolean(p.isCaptain),
          isICaaMember: Boolean(p.isICaaMember),
        })),
        count: countResult[0].total,
      });
    } catch (error) {
      console.error("Error fetching people:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch people",
        message: error.message,
      });
    }
  }
);

// POST /api/admin/reset-password/:userId - Reset user password and remove 2FA (super_admin only)
app.post(
  "/api/admin/reset-password/:userId",
  authenticateToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Generate a random temporary password (8 characters)
      const tempPassword =
        Math.random().toString(36).slice(-8).toUpperCase() +
        Math.random().toString(36).slice(-8).toLowerCase();

      // Hash the temporary password
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Update user: reset password and remove 2FA
      await pool.execute(
        `UPDATE User 
         SET password = ?,
             twoFactorEnabled = 0,
             twoFactorSecret = NULL,
             backupCodes = NULL,
             twoFactorEnabledAt = NULL,
             updatedAt = NOW()
         WHERE id = ?`,
        [hashedPassword, userId]
      );

      res.json({
        success: true,
        message: "Password reset successfully",
        tempPassword: tempPassword,
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reset password",
        message: error.message,
      });
    }
  }
);

// GET /api/cycles - Get all cycles (admin+ only)
app.get(
  "/api/cycles",
  authenticateToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const [cycles] = await pool.execute(`
        SELECT 
          c.id,
          c.code,
          c.city,
          c.notes,
          COUNT(DISTINCT cm.personId) as memberCount,
          COUNT(DISTINCT ca.personId) as captainCount
        FROM Cycle c
        LEFT JOIN CycleMembership cm ON c.id = cm.cycleId
        LEFT JOIN CaptainAssignment ca ON c.id = ca.cycleId
        GROUP BY c.id
        ORDER BY c.code
      `);

      res.json({
        success: true,
        cycles: cycles,
        count: cycles.length,
      });
    } catch (error) {
      console.error("Error fetching cycles:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch cycles",
        message: error.message,
      });
    }
  }
);

// ==================== DEVELOPER DASHBOARD ENDPOINTS ====================

// Get server logs (super_admin only)
app.get(
  "/api/admin/logs",
  authenticateToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const fs = await import("fs/promises");
      const logPath = "/tmp/devlogs-api.log";

      try {
        const logContent = await fs.readFile(logPath, "utf-8");
        const lines = logContent.split("\n").filter(Boolean);
        const recentLines = lines.slice(-100); // Last 100 lines

        const logs = recentLines.map((line) => {
          let level = "info";
          if (line.includes("ERROR") || line.includes("Error")) level = "error";
          else if (line.includes("WARN") || line.includes("Warning"))
            level = "warn";

          return {
            timestamp: new Date().toISOString(),
            message: line,
            level,
          };
        });

        res.json({ logs });
      } catch (fileError) {
        res.json({
          logs: [
            {
              timestamp: new Date().toISOString(),
              message: "No logs available",
              level: "info",
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  }
);

// Get database table statistics
app.get(
  "/api/admin/table-stats",
  authenticateToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const [tables] = await pool.query(`
        SELECT 
          table_name AS tableName,
          table_rows AS rowCount,
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS dataSize
        FROM information_schema.tables
        WHERE table_schema = 'devlogs'
        ORDER BY table_name
      `);

      const stats = tables.map((t) => ({
        tableName: t.tableName,
        rowCount: parseInt(t.rowCount) || 0,
        dataSize: `${t.dataSize} MB`,
      }));

      res.json({ stats });
    } catch (error) {
      console.error("Error fetching table stats:", error);
      res.status(500).json({ error: "Failed to fetch table stats" });
    }
  }
);

// Get user analytics
app.get(
  "/api/admin/user-stats",
  authenticateToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const [totalUsers] = await pool.query(
        "SELECT COUNT(*) as count FROM User"
      );
      const [activeUsers] = await pool.query(
        "SELECT COUNT(*) as count FROM User WHERE lastLoginAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
      );
      const [adminUsers] = await pool.query(
        "SELECT COUNT(*) as count FROM User WHERE role IN ('admin', 'super_admin')"
      );
      const [recentSignups] = await pool.query(
        "SELECT COUNT(*) as count FROM User WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
      );

      res.json({
        totalUsers: totalUsers[0].count,
        activeUsers: activeUsers[0].count,
        adminUsers: adminUsers[0].count,
        recentSignups: recentSignups[0].count,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  }
);

// Run predefined query
app.get(
  "/api/admin/query/:queryId",
  authenticateToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const { queryId } = req.params;
      let query,
        params = [];

      switch (queryId) {
        case "recent-users":
          query =
            "SELECT id, username, email, createdAt FROM User WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY createdAt DESC LIMIT 50";
          break;
        case "active-sessions":
          query =
            "SELECT id, username, email, lastLoginAt FROM User WHERE lastLoginAt >= CURDATE() ORDER BY lastLoginAt DESC LIMIT 50";
          break;
        case "popular-tags":
          query =
            "SELECT tags, COUNT(*) as count FROM DevLog WHERE tags IS NOT NULL GROUP BY tags ORDER BY count DESC LIMIT 20";
          break;
        case "user-activity":
          query =
            "SELECT u.username, COUNT(d.id) as logCount, MAX(d.createdAt) as lastLog FROM User u LEFT JOIN DevLog d ON u.id = d.userId GROUP BY u.id ORDER BY logCount DESC LIMIT 50";
          break;
        case "error-logs":
          query =
            "SELECT * FROM DevLog WHERE content LIKE '%error%' OR content LIKE '%ERROR%' ORDER BY createdAt DESC LIMIT 50";
          break;
        default:
          return res.status(400).json({ error: "Invalid query ID" });
      }

      const [results] = await pool.query(query, params);
      res.json({ queryId, results });
    } catch (error) {
      console.error("Error running query:", error);
      res.status(500).json({ error: "Failed to run query" });
    }
  }
);

// Restart server
app.post(
  "/api/admin/restart",
  authenticateToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      res.json({ success: true, message: "Server restart initiated" });

      // Trigger daemon restart by touching the index.js file
      setTimeout(async () => {
        const fs = await import("fs/promises");
        const now = new Date();
        await fs.utimes("/home/public/index.js", now, now);
      }, 1000);
    } catch (error) {
      console.error("Error restarting server:", error);
      res.status(500).json({ error: "Failed to restart server" });
    }
  }
);

// Export data as CSV
app.get(
  "/api/admin/export/:type",
  authenticateToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const { type } = req.params;
      let query, filename;

      switch (type) {
        case "users":
          query =
            "SELECT id, username, email, firstName, lastName, role, createdAt, lastLoginAt FROM User";
          filename = "users.csv";
          break;
        case "devlogs":
          query =
            "SELECT id, userId, title, content, tags, isPublished, createdAt FROM DevLog";
          filename = "devlogs.csv";
          break;
        case "persons":
          query = "SELECT * FROM Person";
          filename = "persons.csv";
          break;
        default:
          return res.status(400).json({ error: "Invalid export type" });
      }

      const [results] = await pool.query(query);

      if (results.length === 0) {
        return res.status(404).json({ error: "No data to export" });
      }

      // Convert to CSV
      const headers = Object.keys(results[0]);
      const csv = [
        headers.join(","),
        ...results.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              if (value === null) return "";
              if (
                typeof value === "string" &&
                (value.includes(",") || value.includes('"'))
              ) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(",")
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(csv);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  }
);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`DevLogger API server running on port ${PORT}`);
});
