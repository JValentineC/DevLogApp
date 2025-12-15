import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔍 Testing database connection...");

    // Test connection
    await prisma.$connect();
    console.log("✅ Database connected successfully!");

    // Create a test DevLog entry
    const newLog = await prisma.devLog.create({
      data: {
        title: "First DevLog Entry",
        content: "This is my first development log entry using Prisma!",
        tags: "prisma,database,setup",
        isPublished: true,
      },
    });

    console.log("📝 Created DevLog:", newLog);

    // Fetch all DevLogs
    const allLogs = await prisma.devLog.findMany();
    console.log("📋 All DevLogs:", allLogs);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
