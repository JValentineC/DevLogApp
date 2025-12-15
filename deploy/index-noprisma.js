import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

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
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "DevLogger API is running" });
});

// POST /api/auth/login - User login
app.post("/api/auth/login", async (req, res) => {
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
      "SELECT id, username, password, email, name, profilePhoto, bio FROM User WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

    const user = users[0];

    // Compare password (plain text for now - in production, use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(
      `${user.id}:${user.username}:${Date.now()}`
    ).toString("base64");

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
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

// PUT /api/users/:id - Update user profile
app.put("/api/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, name, bio, profilePhoto, currentPassword, newPassword } =
      req.body;

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: "Current password required to change password",
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

      if (users[0].password !== currentPassword) {
        return res.status(401).json({
          success: false,
          error: "Current password is incorrect",
        });
      }

      // Update with new password
      await pool.execute(
        "UPDATE User SET username = ?, name = ?, bio = ?, profilePhoto = ?, password = ? WHERE id = ?",
        [username, name, bio, profilePhoto, newPassword, userId]
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
});

// GET /api/devlogs - Get all dev log entries
app.get("/api/devlogs", async (req, res) => {
  try {
    const { published, limit, offset } = req.query;

    let query = "SELECT * FROM DevLog";
    const params = [];

    if (published !== undefined) {
      query += " WHERE isPublished = ?";
      params.push(published === "true" ? 1 : 0);
    }

    query += " ORDER BY createdAt DESC";

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

    // Convert MySQL boolean integers to actual booleans
    const formattedEntries = entries.map((entry) => ({
      ...entry,
      isPublished: Boolean(entry.isPublished),
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

    const [entries] = await pool.execute("SELECT * FROM DevLog WHERE id = ?", [
      id,
    ]);

    if (entries.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Dev log entry not found",
      });
    }

    res.json({
      success: true,
      data: entries[0],
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

// POST /api/devlogs - Create a new dev log entry
app.post("/api/devlogs", async (req, res) => {
  try {
    const { title, content, tags, isPublished } = req.body;

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
      "INSERT INTO DevLog (title, content, tags, isPublished, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [title, content, tags || null, isPublished || false]
    );

    const [newEntry] = await pool.execute("SELECT * FROM DevLog WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      success: true,
      message: "Dev log entry created successfully",
      data: newEntry[0],
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

// PUT /api/devlogs/:id - Update a dev log entry
app.put("/api/devlogs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, isPublished } = req.body;

    const [existing] = await pool.execute("SELECT * FROM DevLog WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Dev log entry not found",
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

    const [updated] = await pool.execute("SELECT * FROM DevLog WHERE id = ?", [
      id,
    ]);

    res.json({
      success: true,
      message: "Dev log entry updated successfully",
      data: updated[0],
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

// DELETE /api/devlogs/:id - Delete a dev log entry
app.delete("/api/devlogs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute("SELECT * FROM DevLog WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Dev log entry not found",
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

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`DevLogger API server running on port ${PORT}`);
});
