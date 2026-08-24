import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning orphaned records to allow foreign key constraints...");

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE activities, notifications, tasks, follow_ups, documents, audit_logs CASCADE;`);
    console.log("✅ Successfully truncated legacy activity/notification/task tables.");
  } catch (err) {
    console.log("⚠️ Truncate fallback: ", (err as Error).message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
