import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "DevLogger API is running" });
});

// GET /api/devlogs - Get all dev log entries
app.get("/api/devlogs", async (req, res) => {
  try {
    const { published, limit, offset } = req.query;

    const where =
      published !== undefined
        ? {
            isPublished: published === "true",
          }
        : {};

    const devLogs = await prisma.devLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    res.json({
      success: true,
      data: devLogs,
      count: devLogs.length,
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

// GET /api/devlogs/:id - Get a specific dev log entry
app.get("/api/devlogs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const devLog = await prisma.devLog.findUnique({
      where: { id: parseInt(id) },
    });

    if (!devLog) {
      return res.status(404).json({
        success: false,
        error: "Dev log not found",
      });
    }

    res.json({
      success: true,
      data: devLog,
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
        error: "Title and content are required",
        details: {
          title: !title ? "Title is required" : null,
          content: !content ? "Content is required" : null,
        },
      });
    }

    if (title.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Title must be at least 3 characters long",
      });
    }

    if (content.length < 10) {
      return res.status(400).json({
        success: false,
        error: "Content must be at least 10 characters long",
      });
    }

    const devLog = await prisma.devLog.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        tags: tags?.trim() || null,
        isPublished: Boolean(isPublished),
      },
    });

    res.status(201).json({
      success: true,
      data: devLog,
      message: "Dev log created successfully",
    });
  } catch (error) {
    console.error("Error creating dev log:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create dev log",
      message: error.message,
    });
  }
});

// PUT /api/devlogs/:id - Update a dev log entry
app.put("/api/devlogs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, isPublished } = req.body;

    // Check if dev log exists
    const existingDevLog = await prisma.devLog.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingDevLog) {
      return res.status(404).json({
        success: false,
        error: "Dev log not found",
      });
    }

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "Title and content are required",
      });
    }

    const updatedDevLog = await prisma.devLog.update({
      where: { id: parseInt(id) },
      data: {
        title: title.trim(),
        content: content.trim(),
        tags: tags?.trim() || null,
        isPublished: Boolean(isPublished),
      },
    });

    res.json({
      success: true,
      data: updatedDevLog,
      message: "Dev log updated successfully",
    });
  } catch (error) {
    console.error("Error updating dev log:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update dev log",
      message: error.message,
    });
  }
});

// DELETE /api/devlogs/:id - Delete a dev log entry
app.delete("/api/devlogs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if dev log exists
    const existingDevLog = await prisma.devLog.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingDevLog) {
      return res.status(404).json({
        success: false,
        error: "Dev log not found",
      });
    }

    await prisma.devLog.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Dev log deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dev log:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete dev log",
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DevLogger API server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
});

export default app;
