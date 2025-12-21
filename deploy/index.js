import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  authenticateToken,
  authorizeOwner,
  generateToken,
  requireRole,
} from "./middleware/auth.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use("/api/", limiter);

// Middleware
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
        error: "Username and password are required",
      });
    }

    // Query user from database
    const [users] = await pool.execute(
      "SELECT id, username, password, email, name, profilePhoto, bio, role FROM User WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

    const user = users[0];

    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

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

// POST /api/auth/register - User registration
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

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
      "INSERT INTO User (username, email, password, firstName, lastName, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'user', NOW(), NOW())",
      [username, email, hashedPassword, firstName, lastName]
    );

    // Generate JWT token
    const token = generateToken(result.insertId, username, email, "user");

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: result.insertId,
        username,
        email,
        name: `${firstName} ${lastName}`,
      },
      token,
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

      // Fetch updated user data
      const [updatedUsers] = await pool.execute(
        "SELECT id, username, email, name, profilePhoto, bio FROM User WHERE id = ?",
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
      const [users] = await pool.execute(
        "SELECT id, username, email, firstName, lastName, role, createdAt, updatedAt FROM User ORDER BY createdAt DESC"
      );

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

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`DevLogger API server running on port ${PORT}`);
});
